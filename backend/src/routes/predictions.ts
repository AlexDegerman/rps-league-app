import { Router } from 'express'
import {
  savePrediction,
  getUserPredictions,
  getUserStats,
  getUserPoints
} from '../services/predictionService.js'
import pool from '../utils/db.js'

const router = Router()

// GET /api/predictions/leaderboard/unified
router.get('/leaderboard/unified', async (req, res) => {
  try {
    const tab = (req.query.tab as string) || 'daily'
    const sortParam = (req.query.sort as string) || ''
    const dir = req.query.dir === 'asc' ? 'ASC' : 'DESC'

    const peakColumn =
      tab === 'daily'
        ? 'u.daily_peak'
        : tab === 'weekly'
          ? 'u.weekly_peak'
          : 'u.peak_points'

    const sortWhitelist: Record<string, string> = {
      points: 'u.points',
      gained: 'gained',
      peak: peakColumn,
      wins: 'wins',
      losses: 'losses',
      winrate: 'win_rate'
    }

    const now = new Date()
    now.setUTCHours(0, 0, 0, 0)
    const dayStartMs = now.getTime()

    const weekStart = new Date()
    weekStart.setUTCHours(0, 0, 0, 0)
    const day = weekStart.getUTCDay()
    const diff = day === 0 ? 6 : day - 1
    weekStart.setUTCDate(weekStart.getUTCDate() - diff)
    const weekStartMs = weekStart.getTime()

    const periodStart =
      tab === 'daily' ? dayStartMs : tab === 'weekly' ? weekStartMs : 0
    const hasPeriod = periodStart > 0

    const defaultSort =
      tab === 'daily' ? 'points' : tab === 'weekly' ? 'gained' : 'peak'
    const sortKey = sortWhitelist[sortParam] ?? sortWhitelist[defaultSort]

    const result = await pool.query(
      `
      SELECT
        u.user_id,
        u.nickname,
        u.points,
        ${peakColumn} AS peak_points,
        COALESCE(SUM(p.gain_loss) FILTER (WHERE p.gain_loss > 0 ${hasPeriod ? 'AND p.created_at >= $1' : ''}), 0) AS gained,
        COUNT(p.id) FILTER (WHERE p.result = 'WIN' ${hasPeriod ? 'AND p.created_at >= $1' : ''}) AS wins,
        COUNT(p.id) FILTER (WHERE p.result = 'LOSE' ${hasPeriod ? 'AND p.created_at >= $1' : ''}) AS losses,
        CASE
          WHEN (
            COUNT(p.id) FILTER (WHERE p.result = 'WIN' ${hasPeriod ? 'AND p.created_at >= $1' : ''}) +
            COUNT(p.id) FILTER (WHERE p.result = 'LOSE' ${hasPeriod ? 'AND p.created_at >= $1' : ''})
          ) > 0
          THEN ROUND(
            COUNT(p.id) FILTER (WHERE p.result = 'WIN' ${hasPeriod ? 'AND p.created_at >= $1' : ''})::numeric /
            (
              COUNT(p.id) FILTER (WHERE p.result = 'WIN' ${hasPeriod ? 'AND p.created_at >= $1' : ''}) +
              COUNT(p.id) FILTER (WHERE p.result = 'LOSE' ${hasPeriod ? 'AND p.created_at >= $1' : ''})
            ) * 100
          )
          ELSE 0
        END AS win_rate
      FROM users u
      LEFT JOIN predictions p ON u.user_id = p.user_id
      WHERE EXISTS (
        SELECT 1 FROM predictions p2
        WHERE p2.user_id = u.user_id
        ${hasPeriod ? 'AND p2.created_at >= $1' : ''}
      )
      GROUP BY u.user_id, u.nickname, u.points, u.peak_points, u.daily_peak, u.weekly_peak
      ORDER BY ${sortKey} ${dir}, u.nickname ASC
      LIMIT 100
    `,
      hasPeriod ? [periodStart] : []
    )

    const sanitizedRows = result.rows.map((row) => ({
      ...row,
      points: row.points.toString(),
      peak_points: row.peak_points.toString(),
      gained: row.gained.toString()
    }))

    res.json(sanitizedRows)
  } catch (err) {
    console.error('Unified leaderboard error:', err)
    res.status(500).json({ error: 'Failed to fetch leaderboard' })
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
      BigInt(betAmount),
      nickname
    )
    if (!result.success) return res.status(400).json({ error: result.error })
    res.json({ success: true })
  } catch (err) {
    console.error('Prediction error:', err)
    res.status(500).json({ error: 'Failed to save prediction' })
  }
})

// GET /api/stats
router.get('/stats', async (req, res) => {
  try {
    const [users, predictions, matches, activeBets] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM users`),
      pool.query(`SELECT COUNT(*) FROM predictions`),
      pool.query(`SELECT COUNT(*) FROM matches`),
      pool.query(`SELECT COUNT(*) FROM predictions WHERE result IS NULL`)
    ])
    res.json({
      users: Number(users.rows[0].count),
      predictions: Number(predictions.rows[0].count),
      matches: Number(matches.rows[0].count),
      activeBets: Number(activeBets.rows[0].count)
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

// GET /api/stats/daily
router.get('/stats/daily', async (req, res) => {
  try {
    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)
    const todayStartMs = todayStart.getTime()

    const [volumeRes, mvpRes] = await Promise.all([
      pool.query(
        `
        SELECT
          COALESCE(SUM(bet_amount), 0) AS total_volume,
          COALESCE(SUM(gain_loss), 0) AS daily_payout,
          COUNT(*) AS total_bets,
          COUNT(*) FILTER (WHERE result = 'WIN') AS wins
        FROM predictions
        WHERE created_at >= $1
      `,
        [todayStartMs]
      ),
      pool.query(
        `
        SELECT u.nickname, SUM(p.gain_loss) AS total_gain
        FROM predictions p
        JOIN users u ON p.user_id = u.user_id
        WHERE p.created_at >= $1 AND p.gain_loss IS NOT NULL
        GROUP BY u.nickname
        ORDER BY total_gain DESC
        LIMIT 1
      `,
        [todayStartMs]
      )
    ])

    const row = volumeRes.rows[0]
    const total = Number(row.total_bets)
    const wins = Number(row.wins)

    res.json({
      totalVolume: row.total_volume.toString(),
      dailyPayout: row.daily_payout.toString(),
      totalBets: total,
      winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
      mvp: mvpRes.rows[0]
        ? {
            nickname: mvpRes.rows[0].nickname,
            gain: mvpRes.rows[0].total_gain.toString()
          }
        : null
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch daily stats' })
  }
})

// POST /api/users/recover
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
      points: result.rows[0].points.toString()
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to recover profile' })
  }
})

// POST /api/predictions/reset/daily
router.post('/reset/daily', async (req, res) => {
  try {
    const secret = req.headers['x-reset-secret']
    if (secret !== process.env.RESET_SECRET)
      return res.status(401).json({ error: 'Unauthorized' })

    await pool.query(`UPDATE users SET daily_peak = points`)
    res.json({ success: true, reset: 'daily' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset daily peak' })
  }
})

// POST /api/predictions/reset/weekly
router.post('/reset/weekly', async (req, res) => {
  try {
    const secret = req.headers['x-reset-secret']
    if (secret !== process.env.RESET_SECRET)
      return res.status(401).json({ error: 'Unauthorized' })

    await pool.query(`UPDATE users SET weekly_peak = points`)
    res.json({ success: true, reset: 'weekly' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset weekly peak' })
  }
})

// GET /api/users/:userId/recovery
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
      return res.json({
        points: points.toString(),
        peak_points: points.toString()
      })
    }
    res.json({
      points: result.rows[0].points.toString(),
      peak_points: result.rows[0].peak_points.toString()
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch points' })
  }
})

// GET /api/predictions/:userId/stats
router.get('/:userId/stats', async (req, res) => {
  try {
    const stats = await getUserStats(req.params.userId)
    const sanitizedStats = {
      ...stats,
      points: stats.points?.toString(),
      peak_points: stats.peak_points?.toString(),
      total_gain: stats.total_gain?.toString()
    }
    res.json(sanitizedStats)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user stats' })
  }
})

// GET /api/predictions/:userId
router.get('/:userId', async (req, res) => {
  try {
    const predictions = await getUserPredictions(req.params.userId)
    const sanitizedPredictions = predictions.map((p: any) => ({
      ...p,
      bet_amount: p.bet_amount?.toString(),
      gain_loss: p.gain_loss?.toString()
    }))
    res.json(sanitizedPredictions)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch predictions' })
  }
})

export default router