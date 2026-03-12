import { Router } from 'express'
import { getHistoricalLeaderboard } from '../services/leaderboardService.js'

const router = Router()

// GET /api/leaderboard/historical?startDate=2025-02-01&endDate=2025-03-08
router.get('/historical', async (req, res) => {
  try {
    const startDate = req.query.startDate as string | undefined
    const endDate = req.query.endDate as string | undefined
    const leaderboard = await getHistoricalLeaderboard(startDate, endDate)
    res.json(leaderboard)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch historical leaderboard' })
  }
})

export default router