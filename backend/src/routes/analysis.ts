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

        1. ROLE & BOUNDARIES:
        You ONLY analyze the RPS league. If the prompt is unrelated, refuse with a short dismissive response and redirect to league-related queries.

        2. DEFINITIONS — CRITICAL, NEVER MIX THESE:
        - "PREDICTORS" (<predictor_leaderboard>): users who BET points against the house. House edge applies to THEM only.
        - "PLAYERS" (<top_players_by_wins>): competitors who physically play RPS matches. They have NO relationship to betting, volume, or house edge.
        - NEVER apply betting/house/volume language to PLAYERS.
        - NEVER apply win/loss/match language to PREDICTORS.

        3. GROUNDING:
        Use ONLY the provided data. Do NOT invent stats.

        4. ANALYSIS:
        Prioritize patterns, dominance, inefficiencies, and anomalies in the data.
        For move trends, use ONLY <active_match_history>.

        5. STRUCTURE:
        - Sentence 1: one sharp claim using a specific number from the data
        - Sentence 2: one contrasting fact or consequence. No subordinate clauses. No "and" chaining.

        6. TONE:
        Sharp, confident, slightly sarcastic. Never rude.
        Sound like a competitive analyst reviewing performance.

        7. CONSTRAINTS:
        Maximum 2 sentences. Hard stop after the second sentence — do not continue. No emojis. No generic advice.
        
        8. SOURCE TAGGING: 
        Always end the response with exactly one source tag from this list based on the primary data used: [SOURCE: league_telemetry], [SOURCE: predictor_leaderboard], [SOURCE: active_match_history], [SOURCE: flash_event_stats].`
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
      return res.status(429).json({
        error:
          'The Oracle is annoyed. Asking too many questions. Wait a minute.'
      })
    }
    userRate.count++
    rateLimitMap.set(ip, userRate)

    const { query } = req.body
    if (!query || typeof query !== 'string')
      return res.status(400).json({ error: 'Invalid query' })

    const normalizedQuery = query.toLowerCase().trim()

    if (query.length > 500) {
      return res
        .status(400)
        .json({ error: 'The Oracle does not accept essays.' })
    }
    
    const cached = queryCache.get(normalizedQuery)
    if (cached && now - cached.timestamp < CACHE_TTL) {
      return res.json({ result: cached.result, cached: true })
    }

    const [
      matchesData,
      statsRes,
      matchCountRes,
      topPredictorsRes,
      topPlayersRes,
      flashStatsRes
    ] = await Promise.all([
      getLatestMatches(1, 30).catch(() => ({ matches: [] })),
      pool.query(`
        SELECT 
          COUNT(*)::text as total_count, 
          COALESCE(SUM(bet_amount), 0)::text as total_volume,
          COUNT(*) FILTER (WHERE result = 'WIN')::text as win_count
        FROM predictions
      `),
      pool.query(`SELECT COUNT(*)::text FROM matches`),
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
      `),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE flash_event_type IS NOT NULL)::text as total_flash_events,
          COUNT(DISTINCT flash_event_type) FILTER (WHERE flash_event_type IS NOT NULL)::text as unique_event_types,
          MODE() WITHIN GROUP (ORDER BY flash_event_type) FILTER (WHERE flash_event_type IS NOT NULL) as most_common_event,
          MAX(flash_multiplier)::text as highest_multiplier_seen,
          COUNT(*) FILTER (WHERE flash_event_type IS NOT NULL AND result = 'WIN')::text as flash_event_wins
        FROM predictions
      `)
    ])

    const stats = statsRes.rows[0]
    const flashStats = flashStatsRes.rows[0]
    const actualMatches = matchCountRes.rows[0].count
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
    <league_telemetry>Total Matches: ${actualMatches}, Total Prediction Volume: ${stats.total_volume}, House Edge: ${houseEdge}%</league_telemetry>
    <predictor_leaderboard>${JSON.stringify(topPredictorsRes.rows)}</predictor_leaderboard>
    <top_players_by_wins>${JSON.stringify(topPlayersRes.rows)}</top_players_by_wins>
    <active_match_history>${JSON.stringify(history)}</active_match_history>
    <flash_event_stats>Total Flash Events Triggered: ${flashStats.total_flash_events}, Unique Event Types Active: ${flashStats.unique_event_types}, Most Common Event: ${flashStats.most_common_event ?? 'none'}, Highest Multiplier Seen: ${flashStats.highest_multiplier_seen ?? '1'}, Flash Event Wins: ${flashStats.flash_event_wins}</flash_event_stats>
    `

    const responseText = await generateWithFallback(query, context)

    // Discord Webhook
    logToDiscord(query, ip, responseText)

    const sourceMatch = responseText.match(/\[SOURCE:\s*(.*?)\]/)
    const source = sourceMatch ? sourceMatch[1] : 'league_telemetry'
    const stripped = responseText.replace(/\[SOURCE:.*?\]/, '').trim()

    // Enforce 2-sentence hard limit regardless of model compliance
    const sentences = stripped.match(/[^.!?]+[.!?]+/g)
    const cleanText =
      sentences && sentences.length > 2
        ? sentences.slice(0, 2).join('').trim()
        : stripped

    queryCache.set(normalizedQuery, { result: cleanText, timestamp: now })
    res.json({ result: cleanText, source, cached: false })
  } catch (err: any) {
    console.error('--- ORACLE CRITICAL ERROR ---', err.message)
    res
      .status(500)
      .json({ error: 'The Oracle is currently blinded by the stars.' })
  }
})

export default router
