import { Router } from 'express'
import pool from '../utils/db.js'
import {
  getUserRelics,
  equipRelicToSlot,
  unequipRelicFromSlot,
  RELIC_MAP
} from '../services/relicService.js'
import { isWorldBossActive } from '../services/worldBossService.js'

const router = Router()

// GET /api/relics: full inventory
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

// GET /api/relics/equipped: returns array of up to 3 equipped relics
router.get('/equipped', async (req, res) => {
  const { userId } = req.query
  if (!userId || typeof userId !== 'string')
    return res.status(400).json({ error: 'Missing userId' })

  try {
    const result = await pool.query(
      `SELECT equipped_relics FROM users WHERE user_id = $1`,
      [userId]
    )
    const keys: (string | null)[] = result.rows[0]?.equipped_relics ?? []

    // Fetch counters for equipped relics
    const counterRes = await pool.query(
      'SELECT relic_key, counter FROM relics WHERE user_id = $1 AND relic_key = ANY($2)',
      [userId, keys.filter(Boolean)]
    )
    const counterMap = new Map<string, number>()
    for (const r of counterRes.rows)
      counterMap.set(r.relic_key, Number(r.counter ?? 0))

    const relics: (object | null)[] = [null, null, null]
    for (let i = 0; i < 3; i++) {
      const key = keys[i]
      if (!key) continue
      const def = RELIC_MAP[key]
      if (def) relics[i] = { ...def, counter: counterMap.get(key) ?? 0 }
    }

    res.json({ relics })
  } catch (err) {
    console.error('GET /relics/equipped error:', err)
    res.status(500).json({ error: 'Failed to fetch equipped relics' })
  }
})

// POST /api/relics/equip
router.post('/equip', async (req, res) => {
  const { userId, relicKey, slotIndex } = req.body
  if (!userId || !relicKey || slotIndex === undefined)
    return res.status(400).json({ error: 'Missing fields' })
  if (typeof slotIndex !== 'number' || slotIndex < 0 || slotIndex > 2)
    return res.status(400).json({ error: 'Invalid slotIndex (must be 0-2)' })
  if (isWorldBossActive())
    return res
      .status(403)
      .json({ error: 'Relic swapping locked during World Boss encounter' })

  try {
    await equipRelicToSlot(userId, relicKey, slotIndex)
    res.json({ success: true })
  } catch (e: any) {
    res.status(403).json({ error: e.message })
  }
})

// POST /api/relics/unequip
router.post('/unequip', async (req, res) => {
  const { userId, slotIndex } = req.body
  if (!userId) return res.status(400).json({ error: 'Missing userId' })
  if (isWorldBossActive())
    return res
      .status(403)
      .json({ error: 'Relic swapping locked during World Boss encounter' })

  const slot = typeof slotIndex === 'number' ? slotIndex : 0
  try {
    await unequipRelicFromSlot(userId, slot)
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Failed to unequip' })
  }
})

export default router
