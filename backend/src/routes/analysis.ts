import { Router, type Request, type Response } from 'express'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getLatestMatches } from '../services/matchService.js'
import pool from '../utils/db.js'

const router = Router()
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// In-memory storage for performance and cost-saving
const queryCache = new Map<string, { result: string; timestamp: number }>()
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMIT = 5
const CACHE_TTL = 1000 * 60 * 5 // 5 minutes

/**
 * DISCORD AUDIT HELPERS
 * Masks the user IP for privacy and sends the consultation to your Discord channel.
 */
const maskIp = (ip: string): string => {
  if (!ip || ip === 'unknown' || ip === 'anonymous') return 'anonymous'
  const parts = ip.split('.')
  // Returns 192.168.x.x style for privacy
  return parts.length >= 2 ? `${parts[0]}.${parts[1]}.x.x` : ip
}

const logToDiscord = async (query: string, ip: string, response: string) => {
  const webhookUrl = process.env.DISCORD_LOG_WEBHOOK
  if (!webhookUrl || process.env.NODE_ENV !== 'production') return

  try {
    fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [
          {
            title: '🔮 Oracle Consultation',
            color: 0x9b59b6,
            fields: [
              {
                name: '📥 User Prompt',
                value: `\`\`\`${query.substring(0, 1000)}\`\`\``
              },
              {
                name: '👤 Masked IP',
                value: `\`${maskIp(ip)}\``,
                inline: true
              },
              {
                name: '⏱️ Timestamp',
                value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
                inline: true
              },
              {
                name: '📤 Oracle Response',
                value:
                  response.substring(0, 1000) +
                  (response.length > 1000 ? '...' : '')
              }
            ],
            footer: { text: 'RPS League Admin Audit' }
          }
        ]
      })
    }).catch((err) => console.error('Discord Webhook Error:', err))
  } catch (err) {
    // Silent fail to ensure app stability
  }
}

/**
 * MEMORY MANAGEMENT
 * Clears maps every hour to prevent memory leaks in production.
 * Prevents the heap from growing indefinitely by capping rateLimitMap.
 */
setInterval(
  () => {
    const now = Date.now()
    for (const [key, value] of queryCache.entries()) {
      if (now - value.timestamp > CACHE_TTL) queryCache.delete(key)
    }
    // Prevent memory leaks by capping the rate limit map size
    if (rateLimitMap.size > 1000) rateLimitMap.clear()
  },
  1000 * 60 * 60
)

/**
 * Fallback mechanism to rotate models during 503/429 spikes.
 */
async function generateWithFallback(query: string, contextString: string) {
  const modelNames = [
    'gemini-flash-lite-latest',
    'gemini-flash-latest',
    'gemini-2.0-flash-exp'
  ]

  for (const modelName of modelNames) {
    try {
      console.log(`[ORACLE] Attempting generation with ${modelName}...`)
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: `You are "The Oracle," a snarky, data-driven RPS league analyst.
        
        DATA CONTEXT: 
        ${contextString}
        
        DIRECTIVES:
        1. ROLE & BOUNDARIES: You ONLY analyze the RPS league. If the prompt is unrelated to RPS or betting, REFUSE snarkily.
        2. DEFINITIONS: 
          - "PREDICTORS": The users who bet points. Data in <predictor_leaderboard>.
          - "PLAYERS": The combatants in the ring. Data in <top_players_by_wins>.
        3. SUBJECTS: Your knowledge is grounded in 'predictor_leaderboard', 'active_match_history', and 'league_telemetry'.
        4. GROUNDING: Do NOT invent stats. Use provided telemetry only.
        5. LOGIC: For aggression or move trends, look ONLY at active_match_history.
        6. TONE: Analytical, condescending, professional. Max 2 sentences. No emojis.`
      })
      const result = await model.generateContent(query)
      return result.response.text()
    } catch (err: any) {
      console.warn(`[ORACLE] Model ${modelName} failed/busy:`, err.message)
      if (err.message.includes('503') || err.message.includes('429')) continue
      throw err
    }
  }
  throw new Error('All Oracle nodes are currently unresponsive.')
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const ip = (req.headers['x-forwarded-for'] ||
      req.socket.remoteAddress ||
      'anonymous') as string
    const now = Date.now()

    // Rate Limiting Logic
    const userRate = rateLimitMap.get(ip) || {
      count: 0,
      resetTime: now + 60000
    }
    if (now > userRate.resetTime) {
      userRate.count = 0
      userRate.resetTime = now + 60000
    }
    if (userRate.count >= RATE_LIMIT) {
      return res
        .status(429)
        .json({ error: 'Asking too many questions. Wait a minute.' })
    }
    userRate.count++
    rateLimitMap.set(ip, userRate)

    const { query } = req.body
    if (!query || typeof query !== 'string')
      return res.status(400).json({ error: 'Invalid query' })

    const normalizedQuery = query.toLowerCase().trim()
    const cached = queryCache.get(normalizedQuery)
    if (cached && now - cached.timestamp < CACHE_TTL) {
      return res.json({ result: cached.result, cached: true })
    }

    const [matchesData, statsRes, topPredictorsRes, topPlayersRes] =
      await Promise.all([
        getLatestMatches(1, 30).catch(() => ({ matches: [] })),
        pool.query(`
        SELECT 
          COUNT(*)::text as total_count, 
          COALESCE(SUM(bet_amount), 0)::text as total_volume,
          COUNT(*) FILTER (WHERE result = 'WIN')::text as win_count
        FROM predictions
      `),
        pool.query(
          `SELECT nickname, points FROM users ORDER BY points DESC LIMIT 10`
        ),
        pool.query(`
        SELECT name, COUNT(*) as wins FROM (
          SELECT player_a_name as name FROM matches 
          WHERE (player_a_played = 'ROCK' AND player_b_played = 'SCISSORS')
            OR (player_a_played = 'SCISSORS' AND player_b_played = 'PAPER')
            OR (player_a_played = 'PAPER' AND player_b_played = 'ROCK')
          UNION ALL
          SELECT player_b_name as name FROM matches 
          WHERE (player_b_played = 'ROCK' AND player_a_played = 'SCISSORS')
            OR (player_b_played = 'SCISSORS' AND player_a_played = 'PAPER')
            OR (player_b_played = 'PAPER' AND player_a_played = 'ROCK')
        ) as winners
        GROUP BY name
        ORDER BY wins DESC
        LIMIT 5
      `)
      ])

    const stats = statsRes.rows[0]
    const winRate =
      (Number(stats.win_count) / (Number(stats.total_count) || 1)) * 100
    const houseEdge = (100 - winRate).toFixed(1)
    const history = (matchesData.matches || []).map((m: any) => ({
      p1: m.playerA.name,
      p2: m.playerB.name,
      moves: `${m.playerA.played} vs ${m.playerB.played}`
    }))

    // Construct Context with explicit XML tags for Gemini
    const context = `
    <league_telemetry>Total Volume: ${stats.total_volume}, House Edge: ${houseEdge}%</league_telemetry>
    <predictor_leaderboard>${JSON.stringify(topPredictorsRes.rows)}</predictor_leaderboard>
    <top_players_by_wins>${JSON.stringify(topPlayersRes.rows)}</top_players_by_wins>
    <active_match_history>${JSON.stringify(history)}</active_match_history>
    `

    const responseText = await generateWithFallback(query, context)

    // Discord Webhook
    logToDiscord(query, ip, responseText)

    queryCache.set(normalizedQuery, { result: responseText, timestamp: now })
    res.json({ result: responseText, cached: false })
  } catch (err: any) {
    console.error('--- ORACLE CRITICAL ERROR ---', err.message)
    res
      .status(500)
      .json({ error: 'The Oracle is currently blinded by the stars.' })
  }
})

export default router
