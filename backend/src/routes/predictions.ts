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

// Utility to turn massive strings into readable stats
const formatStat = (val: string | number | null | undefined) => {
  if (!val || val === '0' || val === 0) return { formatted: '0', name: 'None' }

  const b = BigInt(val.toString())

  const tiers = [
    { n: 10n ** 63n, s: 'Vg', name: 'Vigintillion' },
    { n: 10n ** 60n, s: 'No', name: 'Novemdecillion' },
    { n: 10n ** 57n, s: 'Oc', name: 'Octodecillion' },
    { n: 10n ** 54n, s: 'Sp', name: 'Septendecillion' },
    { n: 10n ** 51n, s: 'Sx', name: 'Sexdecillion' },
    { n: 10n ** 48n, s: 'Qi', name: 'Quindecillion' },
    { n: 10n ** 45n, s: 'Qa', name: 'Quattuordecillion' },
    { n: 10n ** 42n, s: 'Td', name: 'Tredecillion' },
    { n: 10n ** 39n, s: 'Dd', name: 'Duodecillion' },
    { n: 10n ** 36n, s: 'Ud', name: 'Undecillion' },
    { n: 10n ** 33n, s: 'Dc', name: 'Decillion' },
    { n: 10n ** 30n, s: 'No', name: 'Nonillion' },
    { n: 10n ** 27n, s: 'Oc', name: 'Octillion' },
    { n: 10n ** 24n, s: 'Sp', name: 'Septillion' },
    { n: 10n ** 21n, s: 'Sx', name: 'Sextillion' },
    { n: 10n ** 18n, s: 'Qi', name: 'Quintillion' },
    { n: 10n ** 15n, s: 'Qa', name: 'Quadrillion' },
    { n: 10n ** 12n, s: 'T', name: 'Trillion' },
    { n: 10n ** 9n, s: 'B', name: 'Billion' },
    { n: 10n ** 6n, s: 'M', name: 'Million' }
  ]

  for (const t of tiers) {
    if (b >= t.n) {
      const head = Number((b * 100n) / t.n) / 100
      return { formatted: `${head}${t.s}`, name: t.name }
    }
  }

  return { formatted: b.toString(), name: 'Points' }
}

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

    const stats = {
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
    }

    res.json(stats)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

// GET api/stats/monthly?year=<year>&month=<month>
router.get('/stats/monthly', async (req, res, next) => {
  try {
    const { year, month } = req.query

    if (!year || !month) {
      return res.status(400).json({ error: 'Year and month are required.' })
    }

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
      // Summary Stats
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

      // 1.Biggest Single Win
      pool.query(
        `
        SELECT u.nickname, u.short_id, p.gain_loss 
        FROM predictions p
        JOIN users u ON p.user_id = u.user_id
        WHERE p.created_at >= $1 AND p.created_at < $2
        AND LOWER(p.result) = 'win'
        ORDER BY p.gain_loss DESC LIMIT 1`,
        [startTimestamp, endTimestamp]
      ),

      // Highest Streak among active players this month
      pool.query(
        `
        SELECT u.nickname, u.short_id, u.max_win_streak 
        FROM users u
        WHERE u.user_id IN (SELECT DISTINCT user_id FROM predictions WHERE created_at >= $1 AND created_at < $2)
        ORDER BY u.max_win_streak DESC LIMIT 1`,
        [startTimestamp, endTimestamp]
      ),

      // Most predictions made
      pool.query(
        `
        SELECT u.nickname, u.short_id, COUNT(p.id) as count
        FROM predictions p
        JOIN users u ON p.user_id = u.user_id
        WHERE p.created_at >= $1 AND p.created_at < $2
        GROUP BY u.user_id, u.nickname, u.short_id
        ORDER BY count DESC LIMIT 1`,
        [startTimestamp, endTimestamp]
      ),

      // Highest total bet volume
      pool.query(
        `
        SELECT u.nickname, u.short_id, SUM(p.bet_amount) as total_bet
        FROM predictions p
        JOIN users u ON p.user_id = u.user_id
        WHERE p.created_at >= $1 AND p.created_at < $2
        GROUP BY u.user_id, u.nickname, u.short_id
        ORDER BY total_bet DESC LIMIT 1`,
        [startTimestamp, endTimestamp]
      ),

      // Best Win Rate - min 10 bets to qualify
      pool.query(
        `
        SELECT u.nickname, u.short_id, 
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
    next(err)
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

// GET /api/predictions/:userId/history
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