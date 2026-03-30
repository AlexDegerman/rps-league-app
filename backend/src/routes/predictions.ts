import { Router } from 'express'
import {
  savePrediction,
  getUserPredictions,
  getUserStats
} from '../services/predictionService.js'

const router = Router()

// POST /api/predictions
router.post('/', async (req, res) => {
  try {
    const { userId, gameId, pick } = req.body
    if (!userId || !gameId || !pick)
      return res.status(400).json({ error: 'userId, gameId and pick required' })
    await savePrediction(userId, gameId, pick)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to save prediction' })
  }
})

// GET /api/predictions/:userId
router.get('/:userId', async (req, res) => {
  try {
    const predictions = await getUserPredictions(req.params.userId)
    res.json(predictions)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch predictions' })
  }
})

// GET /api/predictions/:userId/stats
router.get('/:userId/stats', async (req, res) => {
  try {
    const stats = await getUserStats(req.params.userId)
    res.json(stats)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user stats' })
  }
})

export default router
