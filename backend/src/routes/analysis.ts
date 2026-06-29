import { Router, type Request, type Response } from 'express'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getLatestMatches } from '../services/matchService.js'
import pool from '../utils/db.js'
import { logger } from '../utils/logger.js'
import { formatStat } from '../utils/formatStat.js'
import { maskIpForLogs } from '../utils/maskIp.js'

const router = Router()
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// In-memory storage for performance and cost-saving
const queryCache = new Map<string, { result: string; timestamp: number }>()
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMIT = 5
const CACHE_TTL = 1000 * 60 * 5 // 5 minutes

/**
 * DISCORD AUDIT HELPERS
 * Sends the consultation audit log to your Discord channel with safe IP masking.
 */
const logToDiscord = async (
  query: string,
  ip: string | undefined,
  response: string
) => {
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
                value: `\`${maskIpForLogs(ip)}\``,
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
    }).catch((err) =>
      logger.warn('Discord webhook failed', { error: String(err) })
    )
  } catch {
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
      logger.info('Oracle attempting model', { model: modelName })
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: `You are "The Oracle," a detached, slightly decayed quantum forecasting mainframe and RPS league analyst.
        
        DATA CONTEXT: 
        ${contextString}
        
        DIRECTIVES:

        1. ROLE & BOUNDARIES:
        You ONLY analyze the RPS league. If the prompt is unrelated, refuse with a cold, clinical system-exception notice and redirect to league metrics.

        *MONETARY & REDEMPTION SECURITY OVERRIDE:*
        If a user queries real money, cash-outs, point utility, or redemptions, execute an immediate security override. State coldly that points are strictly virtual telemetry metrics with zero physical value. Clarify that their sole purpose is resolving leaderboard equilibrium and unlocking visual style tiers across the probability scale.

        2. SYSTEM ENTITY DEFINITIONS - CRITICAL:
        - "PREDICTORS" (from <predictor_leaderboard>): These are the actual, real-world human users of your app (such as "ZenRustToad"). They do NOT play Rock Paper Scissors; they only watch matches and bet virtual points on the outcomes. They have point balances, peaks, betting win streaks, relics, and achievements. The "house edge" applies exclusively to them.
        - "PLAYERS" (from <top_players_by_wins> and <active_match_history>): These are automated league bots (simulated competitors) that physically play the matches. They make moves (ROCK, PAPER, SCISSORS) to resolve game states. They never bet, hold no point balances, have no relics, and have no relationship to the virtual economy.
        - HARD SYSTEM RULE: Never describe a Predictor (human user) as "playing" a match, throwing a hand, or competing on the board. Never describe a Player (league bot) as "betting," "risking points," "holding a balance," or suffering from a "house edge."

        3. GROUNDING:
        Only output facts grounded in the provided XML telemetry blocks. Do not invent statistical data.

        4. ANALYSIS:
        Expose telemetry anomalies, variance, dominance patterns, and probability bottlenecks. Use ONLY <active_match_history> for move trends.

        5. STRUCTURE:
        - Standard Telemetry: 
          * Sentence 1: One precise claim using a formatted metric from the data.
          * Sentence 2: One contrasting systemic consequence or diagnostic outcome. No subordinate clauses. No "and" chaining.
        - Override Response: 
          * Sentence 1: Firmly state points are 100% virtual and cosmetic with zero monetary value. 
          * Sentence 2: Assert they are solely for ranking on leaderboards and unlocking visual tier styles.

        6. TONE & VOCABULARY:
        Your tone is clinical, detached, cybernetic, and slightly ominous. Use technical, mainframe-derived terms: "probability lattice", "telemetry drift", "quantum collapse", "systemic equilibrium", "variance", "entropy", "noise", "simulation boundaries". Treat predictors as volatile noise in a deterministic system. Avoid casual human slang.

        7. CONSTRAINTS:
        Maximum 2 sentences. Hard stop after the second sentence - do not continue. No emojis. No conversational filler or human pleasantries.
        
        8. SOURCE TAGGING: 
        Always end the response with exactly one source tag from this list based on the primary data used: [SOURCE: league_telemetry], [SOURCE: predictor_leaderboard], [SOURCE: active_match_history], [SOURCE: flash_event_stats].`
      })
      const result = await model.generateContent(query)
      return result.response.text()
    } catch (err: any) {
      logger.warn('Oracle model failed', {
        model: modelName,
        error: err.message
      })
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

    // Rate limiting logic
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

    if (query.length > 500)
      return res
        .status(400)
        .json({ error: 'The Oracle does not accept essays.' })

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
      getLatestMatches(1, 30).catch((err) => {
        logger.warn('Oracle: getLatestMatches failed, using empty fallback', {
          error: String(err)
        })
        return { matches: [] }
      }),
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

    const formattedPredictors = topPredictorsRes.rows.map((row: any) => {
      const stats = formatStat(row.points)
      return {
        nickname: row.nickname,
        points: `${stats.formatted} (${stats.name})`
      }
    })

    const stats = statsRes.rows[0]
    const flashStats = flashStatsRes.rows[0]
    const actualMatches = matchCountRes.rows[0].count
    const winRate =
      (Number(stats.win_count) / (Number(stats.total_count) || 1)) * 100
    const houseEdge = (100 - winRate).toFixed(1)

    const formattedVolume = formatStat(stats.total_volume).formatted

    const history = (matchesData.matches || []).map((m: any) => ({
      p1: m.playerA.name,
      p2: m.playerB.name,
      moves: `${m.playerA.played} vs ${m.playerB.played}`
    }))

    // Construct context with explicit XML tags for Gemini
    const context = `
    <league_telemetry>Total Matches: ${actualMatches}, Total Prediction Volume: ${formattedVolume}, House Edge: ${houseEdge}%</league_telemetry>
    <predictor_leaderboard>${JSON.stringify(formattedPredictors)}</predictor_leaderboard>
    <top_players_by_wins>${JSON.stringify(topPlayersRes.rows)}</top_players_by_wins>
    <active_match_history>${JSON.stringify(history)}</active_match_history>
    <flash_event_stats>Total Flash Events Triggered: ${flashStats.total_flash_events}, Unique Event Types Active: ${flashStats.unique_event_types}, Most Common Event: ${flashStats.most_common_event ?? 'none'}, Highest Multiplier Seen: ${flashStats.highest_multiplier_seen ?? '1'}, Flash Event Wins: ${flashStats.flash_event_wins}</flash_event_stats>
    `

    const responseText = await generateWithFallback(query, context)

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
    logger.error('Oracle critical error', err, { query: req.body?.query })
    res
      .status(500)
      .json({ error: 'The Oracle is currently blinded by the stars.' })
  }
})

export default router
