import { Router } from 'express'
import { getCurrentState } from '../services/worldBossService.js'

const router = Router()
const _claimTimestamps = new Map<string, number>()
const CLAIM_COOLDOWN_MS = 8_000

// GET /api/worldboss/state
router.get('/state', (_req, res) => {
  res.json(getCurrentState())
})

// POST /api/worldboss/reward/claim: Compatibility stub. Rewards are auto-distributed.
router.post('/reward/claim', (req, res) => {
  const { userId } = req.body
  if (!userId || typeof userId !== 'string')
    return res.status(400).json({ error: 'Missing userId' })

  const last = _claimTimestamps.get(userId) ?? 0
  if (Date.now() - last < CLAIM_COOLDOWN_MS)
    return res.status(429).json({ error: 'Rate limited' })

  _claimTimestamps.set(userId, Date.now())
  res.json({
    success: true,
    distributed: false,
    message: 'Rewards are distributed automatically'
  })
})

export default router
