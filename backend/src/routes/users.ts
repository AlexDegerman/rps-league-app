import { Router } from 'express'
import pool from '../utils/db.js'
import { getUserPoints } from '../services/userService.js'

const router = Router()

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
    console.error('Recovery error:', err)
    res.status(500).json({ error: 'Failed to recover profile' })
  }
})

// POST /api/users/update-nickname
router.post('/update-nickname', async (req, res) => {
  const { shortId, nickname } = req.body
  const result = await pool.query(
    'UPDATE users SET nickname = $1 WHERE short_id = $2 RETURNING nickname',
    [nickname, shortId]
  )
  if (result.rowCount === 0)
    return res.status(404).json({ error: 'User not found' })
  res.json({ ok: true, nickname: result.rows[0].nickname })
})

// POST /api/users/update-linkedin
router.post('/update-linkedin', async (req, res) => {
  try {
    const { shortId, linkedinUrl, showLinkedinBadge } = req.body
    if (!shortId) return res.status(400).json({ error: 'shortId required' })

    // Normalize URL — add https:// if missing protocol
    let normalizedUrl = linkedinUrl?.trim() || null
    if (
      normalizedUrl &&
      !normalizedUrl.startsWith('http://') &&
      !normalizedUrl.startsWith('https://')
    ) {
      normalizedUrl = `https://${normalizedUrl}`
    }

    // Validate it's actually a LinkedIn URL
    if (normalizedUrl && !normalizedUrl.includes('linkedin.com')) {
      return res.status(400).json({ error: 'Must be a LinkedIn URL' })
    }

    await pool.query(
      `UPDATE users SET linkedin_url = $1, show_linkedin_badge = $2 WHERE short_id = $3`,
      [normalizedUrl, showLinkedinBadge ?? true, shortId]
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update LinkedIn' })
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
        show_linkedin_badge
      FROM users 
      WHERE short_id = $1`,
      [shortId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' })
    }

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
      showLinkedinBadge: user.show_linkedin_badge ?? true
    })
  } catch (err) {
    console.error('Profile fetch error:', err)
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
})

// GET /api/users/recovery/:userId
router.get('/recovery/:userId', async (req, res) => {
  const result = await pool.query(
    `SELECT recovery_code FROM users WHERE user_id = $1`,
    [req.params.userId]
  )
  if (result.rows.length === 0)
    return res.status(404).json({ error: 'User not found' })
  res.json({ recoveryCode: result.rows[0].recovery_code })
})

// GET /api/users/check-name/:nickname
router.get('/check-name/:nickname', async (req, res) => {
  const result = await pool.query(
    'SELECT user_id FROM users WHERE nickname = $1',
    [req.params.nickname]
  )
  res.json({ available: result.rows.length === 0 })
})

// GET /api/users/:userId/points
router.get('/:userId/points', async (req, res) => {
  try {
    const { userId } = req.params
    const { shortId, nickname } = req.query

    const result = await pool.query(
      `SELECT nickname, points, peak_points, daily_peak, weekly_peak FROM users WHERE user_id = $1`,
      [userId]
    )

    if (result.rows.length === 0) {
      if (!shortId) return res.status(400).json({ error: 'shortId required' })
      
      const user = await getUserPoints(userId, shortId as string, nickname as string)
      
      return res.json({
        nickname: user.nickname ?? (nickname as string) ?? 'New Player',
        points: user.points.toString(),
        peakPoints: user.points.toString(),
        dailyPeak: user.points.toString(),
        weeklyPeak: user.points.toString()
      })
    }

    const row = result.rows[0]

    res.json({
      nickname: row.nickname ?? (nickname as string) ?? 'Anonymous',
      points: row.points.toString(),
      peakPoints: row.peak_points.toString(),
      dailyPeak: row.daily_peak.toString(),
      weeklyPeak: row.weekly_peak.toString()
    })
  } catch (err) {
    console.error('Points fetch error:', err)
    res.status(500).json({ error: 'Failed to fetch points' })
  }
})

export default router
