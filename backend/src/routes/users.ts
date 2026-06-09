import { Router } from 'express'
import pool from '../utils/db.js'
import { getUserPoints } from '../services/userService.js'
import { logger } from '../utils/logger.js'

const router = Router()

// 999 OVG. To raise cap: update exponent to match new max tier.
// OVG = 10^87, so 999 OVG = 999 * 10^87.
const ASCENSION_THRESHOLD = 999n * 10n ** 87n

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

// GET /api/admin/utm-stats
router.get('/admin/utm-stats', async (req, res) => {
  try {
    const [usersResult, visitsResult] = await Promise.all([
      pool.query(`
        SELECT
          COALESCE(utm_source, 'direct') AS source,
          COUNT(*)                        AS signups,
          SUM(points)                     AS total_points,
          AVG(points)                     AS avg_points,
          MAX(points)                     AS top_points
        FROM users
        GROUP BY COALESCE(utm_source, 'direct')
        ORDER BY signups DESC
      `),
      pool.query(`
        SELECT
          utm_source AS source,
          COUNT(*)   AS visits
        FROM utm_visits
        GROUP BY utm_source
        ORDER BY visits DESC
      `)
    ])

    const visitMap = Object.fromEntries(
      visitsResult.rows.map((r) => [r.source, Number(r.visits)])
    )

    const platforms = usersResult.rows.map((r) => ({
      source: r.source,
      signups: Number(r.signups),
      visits: visitMap[r.source] ?? 0,
      total_points: r.total_points?.toString() ?? '0',
      avg_points: Math.round(Number(r.avg_points)).toString(),
      top_points: r.top_points?.toString() ?? '0'
    }))

    const totals = {
      signups: platforms.reduce((s: number, p) => s + p.signups, 0),
      visits: Object.values(visitMap).reduce(
        (s: number, v) => s + Number(v),
        0
      ),
      total_points: platforms
        .reduce((s: bigint, p) => s + BigInt(p.total_points), 0n)
        .toString()
    }

    res.json({ totals, platforms })
  } catch (err) {
    logger.error('GET /admin/utm-stats failed', err)
    res.status(500).json({ error: 'Failed to fetch UTM stats' })
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

// POST /api/users/ascend
router.post('/ascend', async (req, res) => {
  try {
    const { userId, shortId } = req.body
    if (!userId || !shortId)
      return res.status(400).json({ error: 'Missing userId or shortId' })

    const userRes = await pool.query(
      `SELECT points, laps, fastest_lap_bets, total_bets_at_last_ascension
        FROM users WHERE user_id = $1`,
      [userId]
    )
    if (userRes.rows.length === 0)
      return res.status(404).json({ error: 'User not found' })

    const row = userRes.rows[0]
    const currentPoints = BigInt(row.points)

    if (currentPoints < ASCENSION_THRESHOLD)
      return res.status(400).json({ error: 'Not enough points to ascend' })

    const totalBetsRes = await pool.query(
      `SELECT COUNT(*) AS total FROM predictions WHERE user_id = $1 AND result IS NOT NULL`,
      [userId]
    )
    const totalBets = Number(totalBetsRes.rows[0].total)
    const betsThisLap = totalBets - Number(row.total_bets_at_last_ascension)

    const currentFastest =
      row.fastest_lap_bets !== null ? Number(row.fastest_lap_bets) : null
    const newFastest =
      currentFastest === null
        ? betsThisLap
        : Math.min(currentFastest, betsThisLap)

    await pool.query(
      `UPDATE users SET
        points = 200000,
        laps = laps + 1,
        fastest_lap_bets = $1,
        total_bets_at_last_ascension = $2,
        peak_points = GREATEST(peak_points, $3)
        WHERE user_id = $4`,
      [newFastest, totalBets, currentPoints.toString(), userId]
    )

    const updated = await pool.query(
      `SELECT laps, fastest_lap_bets FROM users WHERE user_id = $1`,
      [userId]
    )

    logger.info('User ascended', { userId, laps: updated.rows[0].laps })

    res.json({
      success: true,
      laps: Number(updated.rows[0].laps),
      fastestLapBets:
        updated.rows[0].fastest_lap_bets !== null
          ? Number(updated.rows[0].fastest_lap_bets)
          : null
    })
  } catch (err) {
    logger.error('POST /users/ascend failed', err, { userId: req.body?.userId })
    res.status(500).json({ error: 'Ascension failed' })
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
