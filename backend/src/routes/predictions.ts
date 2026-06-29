import { Router } from 'express'
import {
  getPaginatedUserPredictions,
  getUserStats,
  savePrediction
} from '../services/predictionService.js'
import pool from '../utils/db.js'
import { logger } from '../utils/logger.js'
import { formatStat } from '../utils/formatStat.js'

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
    logger.error('POST /predictions failed', err, { body: req.body })
    res.status(500).json({ error: 'Failed to save prediction' })
  }
})

// GET /api/stats
router.get('/stats', async (req, res) => {
  try {
    const [
      users,
      predictions,
      matches,
      globalSums,
      topPointsUser,
      topStreakUser,
      topWinUser
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM users`),
      pool.query(`SELECT COUNT(*) FROM predictions`),
      pool.query(`SELECT COUNT(*) FROM matches`),
      pool.query(
        `SELECT SUM(points) as pts, SUM(total_volume) as vol FROM users`
      ),
      pool.query(
        `SELECT nickname, user_id, short_id, points FROM users ORDER BY points DESC LIMIT 1`
      ),
      pool.query(
        `SELECT nickname, user_id, short_id, max_win_streak FROM users ORDER BY max_win_streak DESC LIMIT 1`
      ),
      pool.query(
        `SELECT nickname, user_id, short_id, biggest_win FROM users ORDER BY biggest_win DESC LIMIT 1`
      )
    ])

    res.json({
      summary: {
        users: Number(users.rows[0].count),
        predictions: Number(predictions.rows[0].count),
        matches: Number(matches.rows[0].count),
        globalPoints: formatStat(globalSums.rows[0].pts),
        globalVolume: formatStat(globalSums.rows[0].vol)
      },
      records: {
        richest: {
          name: topPointsUser.rows[0]?.nickname,
          uid: topPointsUser.rows[0]?.user_id,
          sid: topPointsUser.rows[0]?.short_id,
          value: formatStat(topPointsUser.rows[0]?.points)
        },
        biggestWin: {
          name: topWinUser.rows[0]?.nickname,
          uid: topWinUser.rows[0]?.user_id,
          sid: topWinUser.rows[0]?.short_id,
          value: formatStat(topWinUser.rows[0]?.biggest_win)
        },
        topStreak: {
          name: topStreakUser.rows[0]?.nickname,
          uid: topStreakUser.rows[0]?.user_id,
          sid: topStreakUser.rows[0]?.short_id,
          value: topStreakUser.rows[0]?.max_win_streak
        }
      }
    })
  } catch (err) {
    logger.error('GET /stats failed', err)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

// GET /api/stats/monthly?year=<year>&month=<month>
router.get('/stats/monthly', async (req, res, next) => {
  try {
    const { year, month } = req.query

    if (!year || !month)
      return res.status(400).json({ error: 'Year and month are required.' })

    const startTimestamp = new Date(
      Date.UTC(Number(year), Number(month) - 1, 1)
    ).getTime()
    const endTimestamp = new Date(
      Date.UTC(Number(year), Number(month), 1)
    ).getTime()

    const [
      newUsers,
      monthlyPredictions,
      monthlyVolume,
      monthlyTopWin,
      monthlyTopStreak,
      monthlyMostActive,
      monthlyHighRoller,
      monthlyTopWinRate
    ] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) FROM users WHERE joined_date >= $1 AND joined_date < $2`,
        [startTimestamp, endTimestamp]
      ),
      pool.query(
        `SELECT COUNT(*) FROM predictions WHERE created_at >= $1 AND created_at < $2`,
        [startTimestamp, endTimestamp]
      ),
      pool.query(
        `SELECT SUM(bet_amount) as volume FROM predictions WHERE created_at >= $1 AND created_at < $2`,
        [startTimestamp, endTimestamp]
      ),
      pool.query(
        `SELECT u.nickname, u.short_id, p.gain_loss 
        FROM predictions p
        JOIN users u ON p.user_id = u.user_id
        WHERE p.created_at >= $1 AND p.created_at < $2
        AND LOWER(p.result) = 'win'
        ORDER BY p.gain_loss DESC LIMIT 1`,
        [startTimestamp, endTimestamp]
      ),
      pool.query(
        `SELECT u.nickname, u.short_id, u.max_win_streak 
        FROM users u
        WHERE u.user_id IN (SELECT DISTINCT user_id FROM predictions WHERE created_at >= $1 AND created_at < $2)
        ORDER BY u.max_win_streak DESC LIMIT 1`,
        [startTimestamp, endTimestamp]
      ),
      pool.query(
        `SELECT u.nickname, u.short_id, COUNT(p.id) as count
        FROM predictions p
        JOIN users u ON p.user_id = u.user_id
        WHERE p.created_at >= $1 AND p.created_at < $2
        GROUP BY u.user_id, u.nickname, u.short_id
        ORDER BY count DESC LIMIT 1`,
        [startTimestamp, endTimestamp]
      ),
      pool.query(
        `SELECT u.nickname, u.short_id, SUM(p.bet_amount) as total_bet
        FROM predictions p
        JOIN users u ON p.user_id = u.user_id
        WHERE p.created_at >= $1 AND p.created_at < $2
        GROUP BY u.user_id, u.nickname, u.short_id
        ORDER BY total_bet DESC LIMIT 1`,
        [startTimestamp, endTimestamp]
      ),
      pool.query(
        `SELECT u.nickname, u.short_id, 
        ROUND((COUNT(CASE WHEN LOWER(p.result) = 'win' THEN 1 END)::numeric / COUNT(p.id)) * 100, 1) as win_rate
        FROM predictions p
        JOIN users u ON p.user_id = u.user_id
        WHERE p.created_at >= $1 AND p.created_at < $2
        GROUP BY u.user_id, u.nickname, u.short_id
        HAVING COUNT(p.id) >= 10
        ORDER BY win_rate DESC LIMIT 1`,
        [startTimestamp, endTimestamp]
      )
    ])

    res.json({
      period: {
        year: Number(year),
        month: Number(month),
        label: new Date(startTimestamp).toLocaleString('en-US', {
          month: 'long',
          year: 'numeric'
        })
      },
      summary: {
        newUsers: Number(newUsers.rows[0].count),
        totalPredictions: Number(monthlyPredictions.rows[0].count),
        totalVolume: formatStat(monthlyVolume.rows[0].volume)
      },
      monthlyWinners: {
        biggestWin: monthlyTopWin.rows[0]
          ? {
              nickname: monthlyTopWin.rows[0].nickname,
              shortId: monthlyTopWin.rows[0].short_id,
              value: formatStat(monthlyTopWin.rows[0].gain_loss)
            }
          : null,
        highestStreak: monthlyTopStreak.rows[0]
          ? {
              nickname: monthlyTopStreak.rows[0].nickname,
              shortId: monthlyTopStreak.rows[0].short_id,
              value: Number(monthlyTopStreak.rows[0].max_win_streak)
            }
          : null,
        bets: monthlyMostActive.rows[0]
          ? {
              nickname: monthlyMostActive.rows[0].nickname,
              shortId: monthlyMostActive.rows[0].short_id,
              value: Number(monthlyMostActive.rows[0].count)
            }
          : null,
        volume: monthlyHighRoller.rows[0]
          ? {
              nickname: monthlyHighRoller.rows[0].nickname,
              shortId: monthlyHighRoller.rows[0].short_id,
              value: formatStat(monthlyHighRoller.rows[0].total_bet)
            }
          : null,
        winRate: monthlyTopWinRate.rows[0]
          ? {
              nickname: monthlyTopWinRate.rows[0].nickname,
              shortId: monthlyTopWinRate.rows[0].short_id,
              value: `${monthlyTopWinRate.rows[0].win_rate}%`
            }
          : null
      }
    })
  } catch (err) {
    logger.error('GET /stats/monthly failed', err, {
      year: req.query.year,
      month: req.query.month
    })
    next(err)
  }
})

// GET /api/stats/daily
interface DailyStatsCache {
  totalVolume: string
  dailyPayout: string
  totalBets: number
  winRate: number
  mvp: {
    nickname: string
    gain: string
  } | null
}

let cachedDailyStats: DailyStatsCache | null = null
let dailyStatsCacheExpiry = 0
const CACHE_DURATION_MS = 15000

router.get('/stats/daily', async (req, res) => {
  try {
    const now = Date.now()
    if (cachedDailyStats && now < dailyStatsCacheExpiry) {
      return res.json(cachedDailyStats)
    }

    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)
    const todayStartMs = todayStart.getTime()

    const [volumeRes, mvpRes] = await Promise.all([
      pool.query(
        `SELECT
          COALESCE(SUM(bet_amount), 0) AS total_volume,
          COALESCE(SUM(gain_loss), 0) AS daily_payout,
          COUNT(*) AS total_bets,
          COUNT(*) FILTER (WHERE result = 'WIN') AS wins
        FROM predictions
        WHERE created_at >= $1`,
        [todayStartMs]
      ),
      pool.query(
        `SELECT u.nickname, SUM(p.gain_loss) AS total_gain
        FROM predictions p
        JOIN users u ON p.user_id = u.user_id
        WHERE p.created_at >= $1 AND p.gain_loss IS NOT NULL
        GROUP BY u.nickname
        ORDER BY total_gain DESC
        LIMIT 1`,
        [todayStartMs]
      )
    ])

    const row = volumeRes.rows[0]
    const total = Number(row.total_bets)
    const wins = Number(row.wins)

    const statsResult: DailyStatsCache = {
      totalVolume: formatStat(row.total_volume).formatted,
      dailyPayout: formatStat(row.daily_payout).formatted,
      totalBets: total,
      winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
      mvp: mvpRes.rows[0]
        ? {
            nickname: mvpRes.rows[0].nickname,
            gain: formatStat(mvpRes.rows[0].total_gain).formatted
          }
        : null
    }

    cachedDailyStats = statsResult
    dailyStatsCacheExpiry = now + CACHE_DURATION_MS

    res.json(statsResult)
  } catch (err) {
    logger.error('GET /stats/daily failed', err)
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
    logger.error('POST /reset/daily failed', err)
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
    logger.error('POST /reset/weekly failed', err)
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
    logger.error('GET /:userId/stats failed', err, {
      userId: req.params.userId
    })
    res.status(500).json({ error: 'Failed to fetch user stats' })
  }
})

// GET /api/predictions/user/:userId/history
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
    logger.error('GET /user/:userId/history failed', err, {
      userId: req.params.userId
    })
    res.status(500).json({ error: 'Failed to fetch bet history' })
  }
})

export default router
