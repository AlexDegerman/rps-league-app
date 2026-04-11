import { Router } from 'express'
import {
  getHistoricalLeaderboard,
  getTodayLeaderboard
} from '../services/leaderboardService.js'
import pool from '../utils/db.js'

const router = Router()

// GET /api/leaderboard/unified
router.get('/unified', async (req, res) => {
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
        u.short_id,
        u.points,
        u.linkedin_url,
        u.show_linkedin_badge,
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
      GROUP BY u.user_id, u.nickname, u.short_id, u.points,
              u.peak_points, u.daily_peak, u.weekly_peak,
              u.linkedin_url, u.show_linkedin_badge
      ORDER BY ${sortKey} ${dir}, u.nickname ASC
      LIMIT 100
    `,
      hasPeriod ? [periodStart] : []
    )

    const sanitizedRows = result.rows.map((row) => ({
      userId: row.user_id,
      shortId: row.short_id,
      nickname: row.nickname,
      points: row.points.toString(),
      peakPoints: row.peak_points.toString(),
      gained: row.gained.toString(),
      wins: Number(row.wins),
      losses: Number(row.losses),
      winRate: Number(row.win_rate),
      // Only expose LinkedIn URL if user has opted in to show badge publicly
      linkedinUrl: row.show_linkedin_badge ? (row.linkedin_url ?? null) : null
    }))

    res.json(sanitizedRows)
  } catch (err) {
    console.error('Unified leaderboard error:', err)
    res.status(500).json({ error: 'Failed to fetch leaderboard' })
  }
})

// GET /api/leaderboard/historical?startDate=2026-04-07&endDate=2026-04-10
router.get('/historical', async (req, res) => {
  try {
    const startDate = req.query.startDate as string | undefined
    const endDate = req.query.endDate as string | undefined
    res.json(await getHistoricalLeaderboard(startDate, endDate))
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch historical leaderboard' })
  }
})

// GET /api/leaderboard/today
router.get('/today', async (req, res) => {
  try {
    res.json(await getTodayLeaderboard())
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch today leaderboard' })
  }
})

export default router
