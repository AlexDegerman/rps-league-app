import { Router } from 'express'
import {
  getHistoricalLeaderboard,
  getTodayLeaderboard
} from '../services/leaderboardService.js'

const router = Router()

// GET /api/leaderboard/historical?startDate=2025-02-01&endDate=2025-03-08
router.get('/historical', async (req, res) => {
  try {
    const startDate = req.query.startDate as string | undefined
    const endDate = req.query.endDate as string | undefined
    res.json(await getHistoricalLeaderboard(startDate, endDate))
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch historical leaderboard' })
  }
})

// GET /api/leaderboard/today
router.get('/today', async (req, res) => {
  try {
    res.json(await getTodayLeaderboard())
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch today leaderboard' })
  }
})

export default router
