import { Router } from 'express'
import {
  getHistoricalLeaderboard,
  getTodayLeaderboard
} from '../services/leaderboardService.js'
import pool from '../utils/db.js'
import { logger } from '../utils/logger.js'

const router = Router()

// GET /api/leaderboard/unified
router.get('/unified', async (req, res) => {
  try {
    const tab = (req.query.tab as string) || 'daily'
    const sortParam = (req.query.sort as string) || ''
    const dir = req.query.dir === 'asc' ? 'ASC' : 'DESC'

    if (tab === 'laps') {
      const lapsSortWhitelist: Record<string, string> = {
        laps: 'u.laps',
        points: 'u.points',
        peak: 'u.peak_points'
      }
      const sortKey = lapsSortWhitelist[sortParam] ?? 'u.laps'

      const result = await pool.query(`
        SELECT
          u.user_id,
          u.short_id,
          u.nickname,
          u.points,
          u.peak_points,
          u.laps,
          u.fastest_lap_bets,
          u.linkedin_url,
          u.show_linkedin_badge,
          u.point_style_preference
        FROM users u
        WHERE u.laps > 0
        ORDER BY ${sortKey} ${dir}, u.nickname ASC
        LIMIT 100
      `)

      return res.json(
        result.rows.map((row) => ({
          userId: row.user_id,
          shortId: row.short_id,
          nickname: row.nickname,
          points: row.points.toString(),
          peakPoints: row.peak_points.toString(),
          gained: '0',
          wins: 0,
          losses: 0,
          winRate: 0,
          laps: Number(row.laps),
          fastestLapBets:
            row.fastest_lap_bets !== null ? Number(row.fastest_lap_bets) : null,
          linkedinUrl: row.show_linkedin_badge
            ? (row.linkedin_url ?? null)
            : null,
          pointStylePreference: row.point_style_preference ?? null
        }))
      )
    }

    if (tab === 'speedrun') {
      const speedSortWhitelist: Record<string, string> = {
        fastest: 'u.fastest_lap_bets',
        laps: 'u.laps',
        points: 'u.points'
      }
      const sortKey = speedSortWhitelist[sortParam] ?? 'u.fastest_lap_bets'
      const speedDir = req.query.dir === 'desc' ? 'DESC' : 'ASC'

      const result = await pool.query(`
        SELECT
          u.user_id,
          u.short_id,
          u.nickname,
          u.points,
          u.peak_points,
          u.laps,
          u.fastest_lap_bets,
          u.linkedin_url,
          u.show_linkedin_badge,
          u.point_style_preference
        FROM users u
        WHERE u.laps > 0 AND u.fastest_lap_bets IS NOT NULL
        ORDER BY ${sortKey} ${speedDir}, u.laps DESC, u.nickname ASC
        LIMIT 100
      `)

      return res.json(
        result.rows.map((row) => ({
          userId: row.user_id,
          shortId: row.short_id,
          nickname: row.nickname,
          points: row.points.toString(),
          peakPoints: row.peak_points.toString(),
          gained: '0',
          wins: 0,
          losses: 0,
          winRate: 0,
          laps: Number(row.laps),
          fastestLapBets: Number(row.fastest_lap_bets),
          linkedinUrl: row.show_linkedin_badge
            ? (row.linkedin_url ?? null)
            : null,
          pointStylePreference: row.point_style_preference ?? null
        }))
      )
    }
    if (tab === 'achievements') {
      const result = await pool.query(`
        SELECT
          u.user_id,
          u.short_id,
          u.nickname,
          u.points,
          u.peak_points,
          u.laps,
          u.linkedin_url,
          u.show_linkedin_badge,
          u.point_style_preference,
          u.total_achievements  -- Use the new cached column
        FROM users u
        WHERE u.total_achievements > 0
        ORDER BY u.total_achievements DESC, u.nickname ASC
        LIMIT 100
      `)

      return res.json(
        result.rows.map((row) => ({
          userId: row.user_id,
          shortId: row.short_id,
          nickname: row.nickname,
          points: row.points.toString(),
          peakPoints: row.peak_points.toString(),
          gained: '0',
          wins: 0,
          losses: 0,
          winRate: 0,
          laps: Number(row.laps),
          fastestLapBets: null,
          achievementCount: Number(row.total_achievements),
          linkedinUrl: row.show_linkedin_badge
            ? (row.linkedin_url ?? null)
            : null,
          pointStylePreference: row.point_style_preference ?? null
        }))
      )
    }

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
      `SELECT
        u.user_id,
        u.nickname,
        u.short_id,
        u.points,
        u.linkedin_url,
        u.show_linkedin_badge,
        u.point_style_preference,
        ${peakColumn} AS peak_points,
        COALESCE(SUM(p.gain_loss) FILTER (WHERE p.gain_loss > 0 ${hasPeriod ? 'AND p.created_at >= $1' : ''}), 0) AS gained,
        COUNT(p.id) FILTER (WHERE p.result = 'WIN'  ${hasPeriod ? 'AND p.created_at >= $1' : ''}) AS wins,
        COUNT(p.id) FILTER (WHERE p.result = 'LOSE' ${hasPeriod ? 'AND p.created_at >= $1' : ''}) AS losses,
        CASE
          WHEN (
            COUNT(p.id) FILTER (WHERE p.result = 'WIN'  ${hasPeriod ? 'AND p.created_at >= $1' : ''}) +
            COUNT(p.id) FILTER (WHERE p.result = 'LOSE' ${hasPeriod ? 'AND p.created_at >= $1' : ''})
          ) > 0
          THEN ROUND(
            COUNT(p.id) FILTER (WHERE p.result = 'WIN' ${hasPeriod ? 'AND p.created_at >= $1' : ''})::numeric /
            (
              COUNT(p.id) FILTER (WHERE p.result = 'WIN'  ${hasPeriod ? 'AND p.created_at >= $1' : ''}) +
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
              u.linkedin_url, u.show_linkedin_badge, u.point_style_preference
      ORDER BY ${sortKey} ${dir}, u.nickname ASC
      LIMIT 100`,
      hasPeriod ? [periodStart] : []
    )

    res.json(
      result.rows.map((row) => ({
        userId: row.user_id,
        shortId: row.short_id,
        nickname: row.nickname,
        points: row.points.toString(),
        peakPoints: row.peak_points.toString(),
        gained: row.gained.toString(),
        wins: Number(row.wins),
        losses: Number(row.losses),
        winRate: Number(row.win_rate),
        laps: null,
        fastestLapBets: null,
        linkedinUrl: row.show_linkedin_badge
          ? (row.linkedin_url ?? null)
          : null,
        pointStylePreference: row.point_style_preference ?? null
      }))
    )
  } catch (err) {
    logger.error('GET /leaderboard/unified failed', err, {
      tab: req.query.tab,
      sort: req.query.sort
    })
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
    logger.error('GET /leaderboard/historical failed', err, {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    })
    res.status(500).json({ error: 'Failed to fetch historical leaderboard' })
  }
})

// GET /api/leaderboard/today
router.get('/today', async (req, res) => {
  try {
    res.json(await getTodayLeaderboard())
  } catch (err) {
    logger.error('GET /leaderboard/today failed', err)
    res.status(500).json({ error: 'Failed to fetch today leaderboard' })
  }
})

export default router
