import { Router } from 'express'
import {
  getLatestMatches,
  getMatchesByDate,
  getMatchesByPlayer,
  getAllPlayerNames,
  getPlayerStats
} from '../services/matchService.js'
import { getActivePendingMatch } from '../utils/matchGenerator.js'

const router = Router()

// Returns the single in-progress match (if any) so clients can render the
// betting card immediately on page load without waiting for the next SSE event
router.get('/pending', (req, res) => {
  const active = getActivePendingMatch()
  res.json(active ? [active] : [])
})

// GET /api/matches?page=1&limit=20
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    res.json(await getLatestMatches(page, limit))
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch matches' })
  }
})

// GET /api/matches/by-date?date=2026-02-28&page=1&limit=20
router.get('/by-date', async (req, res) => {
  try {
    const date = req.query.date as string
    if (!date)
      return res
        .status(400)
        .json({ error: 'date query param required (YYYY-MM-DD)' })
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    res.json(await getMatchesByDate(date, page, limit))
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch matches by date' })
  }
})

// GET /api/matches/players
router.get('/players', async (req, res) => {
  try {
    res.json(await getAllPlayerNames())
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch players' })
  }
})

// GET /api/matches/by-player?name=Amara+Chen&page=1&limit=20
router.get('/by-player', async (req, res) => {
  try {
    const name = req.query.name as string
    if (!name)
      return res.status(400).json({ error: 'name query param required' })
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    res.json(await getMatchesByPlayer(name, page, limit))
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch matches by player' })
  }
})

// GET /api/matches/players/:name/stats
router.get('/players/:name/stats', async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name)
    res.json(await getPlayerStats(name))
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch player stats' })
  }
})

export default router
