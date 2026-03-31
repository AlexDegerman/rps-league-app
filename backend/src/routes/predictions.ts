import { Router } from 'express'
import {
  savePrediction,
  getUserPredictions,
  getUserStats,
  getUserPoints
} from '../services/predictionService.js'
import pool from '../utils/db.js'

const router = Router()

// GET /api/predictions/leaderboard — all time by peak points
router.get('/leaderboard', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.user_id,
        u.points,
        u.peak_points,
        COUNT(p.id) FILTER (WHERE p.result = 'WIN') AS wins,
        COUNT(p.id) FILTER (WHERE p.result = 'LOSE') AS losses
      FROM users u
      LEFT JOIN predictions p ON u.user_id = p.user_id
      GROUP BY u.user_id, u.points, u.peak_points
      ORDER BY u.peak_points DESC
      LIMIT 100
    `)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch predictor leaderboard' })
  }
})

// GET /api/predictions/leaderboard/weekly — this week by points gained
router.get('/leaderboard/weekly', async (req, res) => {
  try {
    const weekStart = new Date()
    weekStart.setUTCHours(0, 0, 0, 0)
    weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay())
    const weekStartMs = weekStart.getTime()

    const result = await pool.query(
      `
      SELECT
        u.user_id,
        u.points,
        COALESCE(SUM(p.bet_amount) FILTER (WHERE p.result = 'WIN' AND p.created_at >= $1), 0) AS weekly_gained,
        COUNT(p.id) FILTER (WHERE p.result = 'WIN' AND p.created_at >= $1) AS wins,
        COUNT(p.id) FILTER (WHERE p.result = 'LOSE' AND p.created_at >= $1) AS losses
      FROM users u
      LEFT JOIN predictions p ON u.user_id = p.user_id
      WHERE EXISTS (
        SELECT 1 FROM predictions p2
        WHERE p2.user_id = u.user_id AND p2.created_at >= $1
      )
      GROUP BY u.user_id, u.points
      ORDER BY weekly_gained DESC
      LIMIT 100
    `,
      [weekStartMs]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch weekly leaderboard' })
  }
})

// POST /api/predictions
router.post('/', async (req, res) => {
  try {
    const { userId, gameId, pick, betAmount } = req.body
    if (!userId || !gameId || !pick || !betAmount)
      return res
        .status(400)
        .json({ error: 'userId, gameId, pick and betAmount required' })
    const result = await savePrediction(userId, gameId, pick, Number(betAmount))
    if (!result.success) return res.status(400).json({ error: result.error })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to save prediction' })
  }
})

// GET /api/predictions/:userId/points
router.get('/:userId/points', async (req, res) => {
  try {
    const points = await getUserPoints(req.params.userId)
    res.json({ points })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch points' })
  }
})

// GET /api/predictions/:userId/stats
router.get('/:userId/stats', async (req, res) => {
  try {
    const stats = await getUserStats(req.params.userId)
    res.json(stats)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user stats' })
  }
})

// GET /api/predictions/:userId
router.get('/:userId', async (req, res) => {
  try {
    const predictions = await getUserPredictions(req.params.userId)
    res.json(predictions)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch predictions' })
  }
})

export default router
