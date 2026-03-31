import { Router } from 'express'
import {
  savePrediction,
  getUserPredictions,
  getUserStats,
  getUserPoints
} from '../services/predictionService.js'

const router = Router()

// GET /api/predictions/:userId/points
router.get('/:userId/points', async (req, res) => {
  try {
    const points = await getUserPoints(req.params.userId)
    res.json({ points })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch points' })
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

// GET /api/predictions/:userId
router.get('/:userId', async (req, res) => {
  try {
    const predictions = await getUserPredictions(req.params.userId)
    res.json(predictions)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch predictions' })
  }
})

// POST /api/predictions
router.post('/', async (req, res) => {
  try {
    const { userId, gameId, pick, betAmount } = req.body
    if (!userId || !gameId || !pick || !betAmount)
      return res
        .status(400)
        .json({ error: 'userId, gameId, pick and betAmount required' })
    const result = await savePrediction(userId, gameId, pick, Number(betAmount))
    if (!result.success) return res.status(400).json({ error: result.error })
    res.json({ success: true })
  } catch (err) {
    console.error('Prediction error:', err)
    res.status(500).json({ error: 'Failed to save prediction' })
  }
})

export default router
