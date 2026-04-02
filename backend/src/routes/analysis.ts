import { Router, type Request, type Response } from 'express'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getLatestMatches } from '../services/matchService.js'
import pool from '../utils/db.js'

const router = Router()
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// --- 1. PRO-TIER UTILITIES: Cache & Rate Limiting ---
const queryCache = new Map<string, { result: string; timestamp: number }>()
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMIT = 5 // 5 requests per minute per IP
const CACHE_TTL = 1000 * 60 * 5 // 5 minutes cache

/**
 * Fallback mechanism to rotate models during 503/429 spikes
 */
async function generateWithFallback(query: string, contextString: string) {
  const modelNames = [
    'gemini-flash-lite-latest',
    'gemini-flash-latest',
    'gemini-2.0-flash-exp'
  ]

  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: `You are "The Oracle," a snarky RPS league analyst.
          DATA: ${contextString}.
          DIRECTIVES:
          1. SUBJECTS: 'gambler_leaderboard' (Bettors), 'active_match_history' (RPS Players), 'league_telemetry' (Stats).
          2. LOGIC: If asked about aggression/streaks, look ONLY at active_match_history.
          3. TONE: Analytical, condescending, professional. Max 2 sentences.`
      })
      const result = await model.generateContent(query)
      return result.response.text()
    } catch (err: any) {
      if (err.message.includes('503') || err.message.includes('429')) {
        console.warn(`Oracle: ${modelName} busy, rotating...`)
        continue
      }
      throw err
    }
  }
  throw new Error('Oracle nodes offline.')
}

// --- 2. THE ROUTE ---
router.post('/', async (req: Request, res: Response) => {
  try {
    const ip = (req.headers['x-forwarded-for'] ||
      req.socket.remoteAddress ||
      'anonymous') as string
    const now = Date.now()

    // A. Rate Limit Check
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
        .json({
          error:
            'Asking too many questions. The Oracle is annoyed. Wait a minute.'
        })
    }
    userRate.count++
    rateLimitMap.set(ip, userRate)

    // B. Validate & Cache Check
    const { query } = req.body
    if (!query || typeof query !== 'string')
      return res.status(400).json({ error: 'Invalid query' })

    const normalizedQuery = query.toLowerCase().trim()
    const cached = queryCache.get(normalizedQuery)
    if (cached && now - cached.timestamp < CACHE_TTL) {
      return res.json({ result: cached.result, cached: true })
    }

    // C. Data Fetching
    const [matchesData, statsRes, topUsersRes] = await Promise.all([
      getLatestMatches(1, 30),
      pool.query(`
        SELECT 
          COUNT(*)::text as total_count, 
          COALESCE(SUM(bet_amount), 0)::text as total_volume,
          COUNT(*) FILTER (WHERE result = 'WIN')::text as win_count
        FROM predictions
      `),
      pool.query(
        `SELECT nickname, points FROM users ORDER BY points DESC LIMIT 5`
      )
    ])

    const stats = statsRes.rows[0]

    // D. Context Construction
    const history = (matchesData.matches || []).map((m: any) => ({
      p1: m.player_a_name || m.playerA?.name || 'Unknown',
      p2: m.player_b_name || m.playerB?.name || 'Unknown',
      moves: m.player_a_played
        ? `${m.player_a_played} vs ${m.player_b_played}`
        : m.playerA?.played
          ? `${m.playerA.played} vs ${m.playerB.played}`
          : 'Unknown'
    }))

    const context = JSON.stringify({
      league_telemetry: {
        volume: Number(stats.total_volume),
        house_edge: `${(100 - (Number(stats.win_count) / (Number(stats.total_count) || 1)) * 100).toFixed(1)}%`
      },
      gambler_leaderboard: topUsersRes.rows,
      active_match_history: history
    })

    // E. AI Execution
    const responseText = await generateWithFallback(query, context)

    // F. Store Cache & Respond
    queryCache.set(normalizedQuery, { result: responseText, timestamp: now })
    res.json({ result: responseText, cached: false })
  } catch (err: any) {
    console.error('Final Oracle Error:', err.message)
    res
      .status(500)
      .json({ error: 'The Oracle is currently blinded by the stars.' })
  }
})

export default router
