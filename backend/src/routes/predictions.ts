import { Router } from 'express'
import { getPaginatedUserPredictions, getUserBiggestMultipliers, getUserBiggestWins, getUserStats, savePrediction } from '../services/predictionService.js'
import pool from '../utils/db.js'

const router = Router()

// POST /api/predictions
router.post('/', async (req, res) => {
  try {
    const { userId, gameId, pick, betAmount, nickname, shortId } = req.body 
    
    if (!userId || !gameId || !pick || !betAmount || !nickname || !shortId)
      return res.status(400).json({
        error: 'userId, gameId, pick, betAmount, nickname and shortId required'
      })

    const result = await savePrediction(
      userId,
      gameId,
      pick,
      BigInt(betAmount),
      nickname,
      shortId
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

// GET /api/predictions/:userId/stats
router.get('/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params
    const { shortId } = req.query

    const stats = await getUserStats(userId, shortId as string)
    res.json(stats)
  } catch (err) {
    console.error('Stats fetch error:', err)
    res.status(500).json({ error: 'Failed to fetch user stats' })
  }
})

router.get('/user/:userId/history', async (req, res) => {
  try {
    const { userId } = req.params
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const sort = (req.query.sort as string) || 'recent'
    res.json(
      await getPaginatedUserPredictions(userId, page, limit, sort as any)
    )
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bet history' })
  }
})

export default router