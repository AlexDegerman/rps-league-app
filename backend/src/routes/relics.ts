import { Router } from 'express'
import pool from '../utils/db.js'
import {
  getUserRelics,
  equipRelic,
  unequipRelic,
  RELIC_MAP
} from '../services/relicService.js'

const router = Router()

router.get('/', async (req, res) => {
  const { userId } = req.query
  if (!userId || typeof userId !== 'string')
    return res.status(400).json({ error: 'Missing userId' })
  try {
    const relics = await getUserRelics(userId)
    res.json(relics)
  } catch {
    res.status(500).json({ error: 'Failed to fetch relics' })
  }
})

router.get('/equipped', async (req, res) => {
  const { userId } = req.query
  if (!userId || typeof userId !== 'string')
    return res.status(400).json({ error: 'Missing userId' })

  try {
    const result = await pool.query(
      `SELECT u.equipped_relic, r.counter 
        FROM users u 
        LEFT JOIN relics r ON (r.user_id = u.user_id AND r.relic_key = u.equipped_relic)
        WHERE u.user_id = $1`,
      [userId]
    )

    const row = result.rows[0]
    const key = row?.equipped_relic
    const counter = row?.counter

    if (!key) {
      return res.json({ relic: null })
    }

    const relicData = RELIC_MAP[key]
      ? {
          ...RELIC_MAP[key],
          counter: Number(counter || 0)
        }
      : null

    res.json({ relic: relicData })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch equipped relic' })
  }
})

router.post('/equip', async (req, res) => {
  const { userId, relicKey } = req.body
  if (!userId || !relicKey)
    return res.status(400).json({ error: 'Missing fields' })
  try {
    await equipRelic(userId, relicKey)
    res.json({ success: true })
  } catch (e: any) {
    res.status(403).json({ error: e.message })
  }
})

router.post('/unequip', async (req, res) => {
  const { userId } = req.body
  if (!userId) return res.status(400).json({ error: 'Missing userId' })
  try {
    await unequipRelic(userId)
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Failed' })
  }
})

export default router
