import { Router } from 'express'
import pool from '../utils/db.js'
import { logger } from '../utils/logger.js'

const router = Router()

const VALID_EVENT_TYPES = new Set([
  'TIDAL_SURGE',
  'SOLAR_FLARE',
  'CYCLONE_BLITZ',
  'MIRAGE_CATACLYSM'
])

const EVENT_TYPE_TO_COLUMN: Record<string, string> = {
  TIDAL_SURGE: 'tidal_surge_participations',
  SOLAR_FLARE: 'solar_flare_participations',
  CYCLONE_BLITZ: 'cyclone_blitz_participations',
  MIRAGE_CATACLYSM: 'mirage_cataclysm_participations'
}

// POST /api/global-events/participated
// Called client-side on receiving a global_event SSE with phase = 'ACTIVE'.
// Increments global_event_participations and the specific event type column.
router.post('/participated', async (req, res) => {
  const { userId, eventType } = req.body

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId required' })
  }
  if (!eventType || !VALID_EVENT_TYPES.has(eventType)) {
    return res.status(400).json({ error: 'valid eventType required' })
  }

  const specificColumn = EVENT_TYPE_TO_COLUMN[eventType]

  try {
    await pool.query(
      `UPDATE users
          SET global_event_participations = global_event_participations + 1,
              ${specificColumn} = ${specificColumn} + 1
        WHERE user_id = $1`,
      [userId]
    )
    res.json({ ok: true })
  } catch (err) {
    logger.error('POST /global-events/participated failed', err, {
      userId,
      eventType
    })
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
