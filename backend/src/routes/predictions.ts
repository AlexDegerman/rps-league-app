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
        u.nickname,
        u.points,
        u.peak_points,
        COUNT(p.id) FILTER (WHERE p.result = 'WIN') AS wins,
        COUNT(p.id) FILTER (WHERE p.result = 'LOSE') AS losses
      FROM users u
      LEFT JOIN predictions p ON u.user_id = p.user_id
      GROUP BY u.user_id, u.nickname, u.points, u.peak_points
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
        u.nickname,
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
      GROUP BY u.user_id, u.nickname, u.points
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

// GET /api/predictions/leaderboard/current — ranked by current balance
router.get('/leaderboard/current', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.user_id,
        u.nickname,
        u.points,
        u.peak_points,
        COUNT(p.id) FILTER (WHERE p.result = 'WIN') AS wins,
        COUNT(p.id) FILTER (WHERE p.result = 'LOSE') AS losses
      FROM users u
      LEFT JOIN predictions p ON u.user_id = p.user_id
      GROUP BY u.user_id, u.nickname, u.points, u.peak_points
      ORDER BY u.points DESC
      LIMIT 100
    `)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch current leaderboard' })
  }
})

// POST /api/predictions
router.post('/', async (req, res) => {
  try {
    const { userId, gameId, pick, betAmount, nickname } = req.body
    if (!userId || !gameId || !pick || !betAmount || !nickname)
      return res.status(400).json({
        error: 'userId, gameId, pick, betAmount and nickname required'
      })
    const result = await savePrediction(
      userId,
      gameId,
      pick,
      Number(betAmount),
      nickname
    )
    if (!result.success) return res.status(400).json({ error: result.error })
    res.json({ success: true })
  } catch (err) {
    console.error('Prediction error:', err)
    res.status(500).json({ error: 'Failed to save prediction' })
  }
})

router.get('/stats', async (req, res) => {
  try {
    const [users, predictions, matches] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM users`),
      pool.query(`SELECT COUNT(*) FROM predictions`),
      pool.query(`SELECT COUNT(*) FROM matches`)
    ])
    res.json({
      users: Number(users.rows[0].count),
      predictions: Number(predictions.rows[0].count),
      matches: Number(matches.rows[0].count)
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

// POST /api/users/recover — recover profile by code
router.post('/recover', async (req, res) => {
  try {
    const { recoveryCode } = req.body
    if (!recoveryCode)
      return res.status(400).json({ error: 'Recovery code required' })
    const result = await pool.query(
      `SELECT user_id, nickname, points FROM users WHERE recovery_code = $1`,
      [recoveryCode.toLowerCase().trim()]
    )
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Invalid recovery code' })
    res.json({
      userId: result.rows[0].user_id,
      nickname: result.rows[0].nickname,
      points: result.rows[0].points
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to recover profile' })
  }
})

// GET /api/users/:userId/recovery — get recovery code
router.get('/recovery/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT recovery_code FROM users WHERE user_id = $1`,
      [req.params.userId]
    )
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'User not found' })
    res.json({ recoveryCode: result.rows[0].recovery_code })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recovery code' })
  }
})

// GET /api/predictions/:userId/points
router.get('/:userId/points', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT points, peak_points FROM users WHERE user_id = $1`,
      [req.params.userId]
    )
    if (result.rows.length === 0) {
      const points = await getUserPoints(req.params.userId)
      return res.json({ points, peak_points: points })
    }
    res.json({
      points: Number(result.rows[0].points),
      peak_points: Number(result.rows[0].peak_points)
    })
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
