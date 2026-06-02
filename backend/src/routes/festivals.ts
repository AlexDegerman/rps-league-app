import { Router } from 'express'
import pool from '../utils/db.js'
import { logger } from '../utils/logger.js'
const router = Router()

// POST /api/festivals/participated
// Called client-side on receiving festival_event SSE.
// Increments festivals_participated for the user.
router.post('/participated', async (req, res) => {
  const { userId } = req.body
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId required' })
  }
  try {
    await pool.query(
      'UPDATE users SET festivals_participated = festivals_participated + 1 WHERE user_id = $1',
      [userId]
    )
    res.json({ ok: true })
  } catch (err) {
    logger.error('POST /festivals/participated failed', err, { userId })
    res.status(500).json({ error: 'Internal server error' })
  }
})
export default router