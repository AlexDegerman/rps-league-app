import { Router } from 'express'
import pool from '../utils/db.js'
import {
  getUserRelics,
  getAllLoadouts,
  equipRelicToSlot,
  unequipRelicFromSlot
} from '../services/relicService.js'
import { isWorldBossActive } from '../services/worldBossService.js'
import { getRelicCategory } from '../constants/relics.js'
import type { LoadoutType } from '../types/relics.js'

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
  const { userId, loadout } = req.query
  if (!userId || typeof userId !== 'string')
    return res.status(400).json({ error: 'Missing userId' })

  const targetLoadout: LoadoutType =
    loadout === 'world_boss' ||
    loadout === 'neon_paradise' ||
    loadout === 'prediction'
      ? loadout
      : 'prediction'

  try {
    const loadouts = await getAllLoadouts(userId)
    res.json({
      relics: loadouts[targetLoadout],
      loadout: targetLoadout,
      loadouts
    })
  } catch (err) {
    console.error('GET /relics/equipped error:', err)
    res.status(500).json({ error: 'Failed to fetch equipped relics' })
  }
})

// POST /api/relics/equip
router.post('/equip', async (req, res) => {
  const { userId, relicKey, slotIndex, loadout } = req.body
  if (!userId || !relicKey || slotIndex === undefined)
    return res.status(400).json({ error: 'Missing fields' })
  if (typeof slotIndex !== 'number' || slotIndex < 0 || slotIndex > 2)
    return res.status(400).json({ error: 'Invalid slotIndex (must be 0-2)' })

  const targetLoadout: LoadoutType =
    loadout === 'world_boss' || loadout === 'neon_paradise' || loadout === 'prediction'
      ? loadout
      : getRelicCategory(relicKey)

  if (targetLoadout === 'world_boss' && isWorldBossActive())
    return res
      .status(403)
      .json({ error: 'World Boss loadout is locked during active combat' })

  try {
    await equipRelicToSlot(userId, relicKey, slotIndex, targetLoadout)
    res.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to equip'
    res.status(403).json({ error: message })
  }
})

// POST /api/relics/unequip
router.post('/unequip', async (req, res) => {
  const { userId, slotIndex, loadout } = req.body
  if (!userId) return res.status(400).json({ error: 'Missing userId' })

  const targetLoadout: LoadoutType =
    loadout === 'world_boss' || loadout === 'neon_paradise' || loadout === 'prediction'
      ? loadout
      : 'prediction'

  if (targetLoadout === 'world_boss' && isWorldBossActive())
    return res
      .status(403)
      .json({ error: 'World Boss loadout is locked during active combat' })

  const slot = typeof slotIndex === 'number' ? slotIndex : 0
  try {
    await unequipRelicFromSlot(userId, slot, targetLoadout)
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Failed to unequip' })
  }
})

export default router
