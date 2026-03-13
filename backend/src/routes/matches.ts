import { Router } from 'express'
import { getLatestMatches, getMatchesByDate } from '../services/matchService.js'

const router = Router()

// GET /api/matches?page=1&limit=20
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const result = await getLatestMatches(page, limit)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch matches' })
  }
})

// GET /api/matches/by-date?date=2026-02-28&page=1&limit=20
router.get('/by-date', async (req, res) => {
  try {
    const date = req.query.date as string
    if (!date) return res.status(400).json({ error: 'date query param required (YYYY-MM-DD)' })
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const result = await getMatchesByDate(date, page, limit)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch matches by date' })
  }
})

export default router