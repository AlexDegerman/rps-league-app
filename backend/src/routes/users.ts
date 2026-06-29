import { Router } from 'express'
import pool from '../utils/db.js'
import { getUserPoints } from '../services/userService.js'
import { logger } from '../utils/logger.js'
import { formatStat } from '../utils/formatStat.js'

const router = Router()

// 999 STR. To raise cap: update exponents to match new max tier.
export const ASCENSION_THRESHOLD = 999n * 10n ** 111n

// POST /api/users/recovery-tutorial-complete
router.post('/recovery-tutorial-complete', async (req, res) => {
  const { userId } = req.body
  if (!userId) return res.status(400).json({ error: 'Missing userId' })
  try {
    await pool.query(
      'UPDATE users SET recovery_tutorial_completed = true WHERE user_id = $1',
      [userId]
    )
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Failed' })
  }
})

// GET /api/admin/stats
router.get('/admin/stats', async (req, res) => {
  try {
    const [
      users,
      predictions,
      matches,
      globalSums,
      topPointsUser,
      topStreakUser,
      topWinUser,
      visitsResult,
      geoUtmResult
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
      ),
      pool.query(`
        SELECT
          utm_source AS source,
          COUNT(*)   AS visits
        FROM utm_visits
        GROUP BY utm_source
      `),
      pool.query(`
        SELECT 
          COALESCE(signup_country, 'unknown') AS country,
          COALESCE(signup_town, 'unknown')    AS town,
          COALESCE(utm_source, 'direct')      AS source,
          COUNT(*)::int                       AS signups,
          SUM(points)                         AS total_points,
          AVG(points)::numeric                AS avg_points,
          MAX(points)                         AS top_points
        FROM users
        GROUP BY signup_country, signup_town, COALESCE(utm_source, 'direct')
        ORDER BY signup_country ASC, signup_town ASC, signups DESC
      `)
    ])

    const visitMap = Object.fromEntries(
      visitsResult.rows.map((r) => [r.source, Number(r.visits)])
    )

    const globalSourceMap = new Map<string, {
      source: string
      signups: number
      total_points_raw: bigint
    }>()

    const countryMap = new Map<string, {
      country: string
      signups: number
      total_points_raw: bigint
      townsMap: Map<string, {
        town: string
        signups: number
        total_points_raw: bigint
        avg_points_sum: number
        avg_points_count: number
        top_points_raw: bigint
        utm: Array<{ source: string; signups: number; total_points: string }>
      }>
    }>()

    for (const r of geoUtmResult.rows) {
      const countryCode = r.country
      const townName = r.town
      const source = r.source
      const signups = Number(r.signups)
      const totalPoints = BigInt(r.total_points || '0')
      const topPoints = BigInt(r.top_points || '0')
      const avgPoints = Number(r.avg_points || '0')

      if (!globalSourceMap.has(source)) {
        globalSourceMap.set(source, { source, signups: 0, total_points_raw: 0n })
      }
      const gSource = globalSourceMap.get(source)!
      gSource.signups += signups
      gSource.total_points_raw += totalPoints

      if (!countryMap.has(countryCode)) {
        countryMap.set(countryCode, {
          country: countryCode,
          signups: 0,
          total_points_raw: 0n,
          townsMap: new Map()
        })
      }
      const cData = countryMap.get(countryCode)!
      cData.signups += signups
      cData.total_points_raw += totalPoints

      if (!cData.townsMap.has(townName)) {
        cData.townsMap.set(townName, {
          town: townName,
          signups: 0,
          total_points_raw: 0n,
          avg_points_sum: 0,
          avg_points_count: 0,
          top_points_raw: 0n,
          utm: []
        })
      }
      const tData = cData.townsMap.get(townName)!
      tData.signups += signups
      tData.total_points_raw += totalPoints
      tData.avg_points_sum += avgPoints * signups
      tData.avg_points_count += signups
      if (topPoints > tData.top_points_raw) {
        tData.top_points_raw = topPoints
      }

      tData.utm.push({
        source,
        signups,
        total_points: formatStat(totalPoints.toString()).formatted
      })
    }

    const totalPointsRaw = Array.from(globalSourceMap.values()).reduce(
      (s: bigint, p) => s + p.total_points_raw,
      0n
    )

    const utmTotals = {
      signups: Array.from(globalSourceMap.values()).reduce((s, p) => s + p.signups, 0),
      visits: Object.values(visitMap).reduce((s: number, v) => s + Number(v), 0),
      total_points: formatStat(totalPointsRaw.toString()).formatted
    }

    const utmPlatforms = Array.from(globalSourceMap.values()).map((p) => ({
      source: p.source,
      signups: p.signups,
      visits: visitMap[p.source] ?? 0,
      total_points: formatStat(p.total_points_raw.toString()).formatted
    }))

    const locations = Array.from(countryMap.values()).map((c) => ({
      country: c.country,
      signups: c.signups,
      total_points: formatStat(c.total_points_raw.toString()).formatted,
      towns: Array.from(c.townsMap.values()).map((t) => {
        const calculatedAvg = t.avg_points_count > 0 ? Math.round(t.avg_points_sum / t.avg_points_count) : 0
        return {
          town: t.town,
          signups: t.signups,
          total_points: formatStat(t.total_points_raw.toString()).formatted,
          avg_points: formatStat(calculatedAvg.toString()).formatted,
          top_points: formatStat(t.top_points_raw.toString()).formatted,
          utm_breakdown: t.utm
        }
      })
    }))

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
      },
      utm: {
        totals: utmTotals,
        platforms: utmPlatforms
      },
      locations
    })
  } catch (err) {
    logger.error('GET /api/admin/stats failed', err)
    res.status(500).json({ error: 'Failed to fetch admin dashboard stats' })
  }
})

// POST /api/users/recover
router.post('/recover', async (req, res) => {
  try {
    const { recoveryCode } = req.body
    if (!recoveryCode)
      return res.status(400).json({ error: 'Recovery code required' })

    const result = await pool.query(
      `SELECT user_id, short_id, nickname, points FROM users WHERE recovery_code = $1`,
      [recoveryCode.toLowerCase().trim()]
    )

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Invalid recovery code' })

    const user = result.rows[0]
    res.json({
      userId: user.user_id,
      shortId: user.short_id,
      nickname: user.nickname,
      points: user.points.toString()
    })
  } catch (err) {
    logger.error('POST /users/recover failed', err)
    res.status(500).json({ error: 'Failed to recover profile' })
  }
})

// POST /api/users/update-nickname
router.post('/update-nickname', async (req, res) => {
  const { userId, nickname, shortId } = req.body
  try {
    const result = await pool.query(
      `INSERT INTO users (user_id, short_id, nickname, points, peak_points)
        VALUES ($1, $2, $3, 200000, 200000)
        ON CONFLICT (user_id)
        DO UPDATE SET
          nickname = EXCLUDED.nickname,
          short_id = COALESCE(users.short_id, EXCLUDED.short_id)
        RETURNING nickname`,
      [userId, shortId, nickname]
    )
    res.json({ ok: true, nickname: result.rows[0].nickname })
  } catch (err) {
    logger.error('POST /users/update-nickname failed', err, { userId, shortId })
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/users/update-linkedin
router.post('/update-linkedin', async (req, res) => {
  try {
    const { shortId, linkedinUrl, showLinkedinBadge } = req.body
    if (!shortId) return res.status(400).json({ error: 'shortId required' })

    let normalizedUrl = linkedinUrl?.trim() || null
    if (
      normalizedUrl &&
      !normalizedUrl.startsWith('http://') &&
      !normalizedUrl.startsWith('https://')
    ) {
      normalizedUrl = `https://${normalizedUrl}`
    }
    if (normalizedUrl && !normalizedUrl.includes('linkedin.com')) {
      return res.status(400).json({ error: 'Must be a LinkedIn URL' })
    }

    await pool.query(
      `UPDATE users SET linkedin_url = $1, show_linkedin_badge = $2 WHERE short_id = $3`,
      [normalizedUrl, showLinkedinBadge ?? true, shortId]
    )
    res.json({ success: true })
  } catch (err) {
    logger.error('POST /users/update-linkedin failed', err, {
      shortId: req.body?.shortId
    })
    res.status(500).json({ error: 'Failed to update LinkedIn' })
  }
})

// PATCH /api/users/style-preference
router.patch('/style-preference', async (req, res) => {
  try {
    const { shortId, stylePreference } = req.body
    if (!shortId) return res.status(400).json({ error: 'shortId required' })
    await pool.query(
      `UPDATE users SET point_style_preference = $1 WHERE short_id = $2`,
      [stylePreference ?? null, shortId]
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update style preference' })
  }
})

// GET /api/users/profile/:shortId
router.get('/profile/:shortId', async (req, res) => {
  try {
    const { shortId } = req.params

    const result = await pool.query(
      `SELECT
        user_id,
        short_id,
        nickname,
        points,
        biggest_win,
        max_win_streak,
        joined_date,
        linkedin_url,
        show_linkedin_badge,
        point_style_preference,
        all_time_peak,
        laps,
        fastest_lap_bets
      FROM users
      WHERE short_id = $1`,
      [shortId]
    )

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Profile not found' })

    const user = result.rows[0]

    res.json({
      userId: user.user_id,
      shortId: user.short_id,
      nickname: user.nickname,
      points: user.points.toString(),
      biggestWin: user.biggest_win?.toString() ?? '0',
      maxWinStreak: user.max_win_streak ?? 0,
      joinedDate: user.joined_date ?? null,
      linkedinUrl: user.linkedin_url ?? null,
      showLinkedinBadge: user.show_linkedin_badge ?? true,
      pointStylePreference: user.point_style_preference ?? null,
      allTimePeak: user.all_time_peak?.toString() ?? '200000',
      laps: Number(user.laps ?? 0),
      fastestLapBets:
        user.fastest_lap_bets !== null ? Number(user.fastest_lap_bets) : null
    })
  } catch (err) {
    logger.error('GET /users/profile/:shortId failed', err, {
      shortId: req.params.shortId
    })
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
})

// GET /api/users/recovery/:userId
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
    logger.error('GET /users/recovery/:userId failed', err, {
      userId: req.params.userId
    })
    res.status(500).json({ error: 'Failed to fetch recovery code' })
  }
})

// GET /api/users/check-name/:nickname
router.get('/check-name/:nickname', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT user_id FROM users WHERE nickname = $1',
      [req.params.nickname]
    )
    res.json({ available: result.rows.length === 0 })
  } catch (err) {
    logger.error('GET /users/check-name/:nickname failed', err, {
      nickname: req.params.nickname
    })
    res.status(500).json({ error: 'Failed to check nickname' })
  }
})

// GET /api/users/:userId/points
router.get('/:userId/points', async (req, res) => {
  try {
    const { userId } = req.params
    const { shortId, nickname } = req.query
    const utmSource = (req.query.utm_source as string)?.toLowerCase().trim()

    if (utmSource) {
      pool
        .query(`INSERT INTO utm_visits (utm_source) VALUES ($1)`, [utmSource])
        .catch((err) => logger.warn('utm_visit insert failed', { err }))
    }

    const result = await pool.query(
      `SELECT utm_source, nickname, points, peak_points, daily_peak, weekly_peak,
              current_win_streak, all_time_peak, point_style_preference,
              laps, fastest_lap_bets
        FROM users WHERE user_id = $1`,
      [userId]
    )

    if (result.rows.length === 0) {
      if (!shortId) return res.status(400).json({ error: 'shortId required' })

      const user = await getUserPoints(
        userId,
        shortId as string,
        nickname as string
      )

      if (utmSource) {
        await pool
          .query(`UPDATE users SET utm_source = $1 WHERE user_id = $2`, [
            utmSource,
            userId
          ])
          .catch((err) => logger.warn('New user utm update failed', err))
      }

      return res.json({
        nickname: user.nickname ?? (nickname as string) ?? 'New Player',
        points: user.points.toString(),
        peakPoints: user.points.toString(),
        dailyPeak: user.points.toString(),
        weeklyPeak: user.points.toString(),
        currentWinStreak: 0,
        allTimePeak: user.points.toString(),
        pointStylePreference: null,
        laps: 0,
        fastestLapBets: null
      })
    }

    const row = result.rows[0]

    if (utmSource && (!row.utm_source || row.utm_source === 'direct' || row.utm_source === '')) {
      await pool
        .query(`UPDATE users SET utm_source = $1 WHERE user_id = $2`, [
          utmSource,
          userId
        ])
        .catch((err) =>
          logger.warn('utm_source update failed', { userId, err })
        )
    }

    res.json({
      nickname: row.nickname ?? (nickname as string) ?? 'Anonymous',
      points: row.points.toString(),
      peakPoints: row.peak_points.toString(),
      dailyPeak: row.daily_peak.toString(),
      weeklyPeak: row.weekly_peak.toString(),
      currentWinStreak: Number(row.current_win_streak ?? 0),
      allTimePeak: row.all_time_peak.toString(),
      pointStylePreference: row.point_style_preference ?? null,
      laps: Number(row.laps ?? 0),
      fastestLapBets:
        row.fastest_lap_bets !== null ? Number(row.fastest_lap_bets) : null
    })
  } catch (err) {
    logger.error('GET /users/:userId/points failed', err, {
      userId: req.params.userId
    })
    res.status(500).json({ error: 'Failed to fetch points' })
  }
})

// GET /api/users/idle-eligible/:userId
router.get('/idle-eligible/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    if (!userId) return res.status(400).json({ error: 'Missing userId' })

    const result = await pool.query(
      `SELECT laps, points FROM users WHERE user_id = $1`,
      [userId]
    )
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'User not found' })

    const row = result.rows[0]
    const ASCENSION_THRESHOLD = 999n * 10n ** 87n
    const eligible =
      Number(row.laps) >= 1 || BigInt(row.points) >= ASCENSION_THRESHOLD

    res.json({ eligible })
  } catch (err) {
    logger.error('GET /users/idle-eligible/:userId failed', err, {
      userId: req.params.userId
    })
    res.status(500).json({ error: 'Failed to check idle eligibility' })
  }
})

router.post('/:userId/auto-bet-used', async (req, res) => {
  const { userId } = req.params
  await pool.query(
    `UPDATE users SET has_used_auto_bet = true WHERE user_id = $1`,
    [userId]
  )
  res.json({ ok: true })
})

// GET /api/users/:userId/recovery-tutorial-status
router.get('/:userId/recovery-tutorial-status', async (req, res) => {
  const { userId } = req.params
  try {
    const result = await pool.query(
      'SELECT recovery_tutorial_completed FROM users WHERE user_id = $1',
      [userId]
    )
    res.json({
      recoveryTutorialCompleted: result.rows[0]?.recovery_tutorial_completed ?? false
    })
  } catch {
    res.status(500).json({ error: 'Failed' })
  }
})

export default router
