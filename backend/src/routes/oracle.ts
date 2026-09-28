import { Router } from 'express'
import type { Request, Response } from 'express'
import {
  getOracleState,
  hasUserUsedOracle,
  resetOracle
} from '../services/oracleProphecyService.js'

const router = Router()

// GET /api/oracle - daily prophecy state
router.get('/', async (req: Request, res: Response) => {
  const userId =
    typeof req.query.userId === 'string' ? req.query.userId : undefined
  const state = getOracleState()
  const used = userId ? await hasUserUsedOracle(userId) : false
  res.json({ side: state.side, date: state.date, used })
})

// POST /api/oracle/reset - called by GitHub Actions cron
router.post('/reset', (req: Request, res: Response) => {
  const secret = req.headers['x-reset-secret']
  if (secret !== process.env.RESET_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  resetOracle()
  res.json({ ok: true, newSide: getOracleState().side })
})

export default router
