import { Router } from 'express'
import { getLatestMatches } from '../services/matchService.js'

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

export default router