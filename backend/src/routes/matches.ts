import { Router } from 'express'
import {
  getLatestMatches,
  getMatchesByDate,
  getMatchesByPlayer,
  getAllPlayerNames,
  getPlayerStats
} from '../services/matchService.js'

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
    if (!date)
      return res
        .status(400)
        .json({ error: 'date query param required (YYYY-MM-DD)' })
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const result = await getMatchesByDate(date, page, limit)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch matches by date' })
  }
})

// GET /api/matches/players
router.get('/players', async (req, res) => {
  try {
    const players = await getAllPlayerNames()
    res.json(players)
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
    const result = await getMatchesByPlayer(name, page, limit)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch matches by player' })
  }
})

// GET /api/players/:name/stats
router.get('/players/:name/stats', async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name)
    const stats = await getPlayerStats(name)
    res.json(stats)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch player stats' })
  }
})

export default router
