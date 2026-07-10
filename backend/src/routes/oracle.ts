import { Router } from 'express'
import type { Request, Response } from 'express'
import { checkRateLimit } from '../oracle/rateLimiter.js'
import { consultOracle } from '../services/oracleConsultService.js'
import {
  getOracleState,
  hasUserUsedOracle,
  resetOracle
} from '../services/oracleProphecyService.js'
import { logger } from '../utils/logger.js'

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

// POST /api/oracle/consult - AI consultation
router.post('/consult', async (req: Request, res: Response) => {
  try {
    const ip = (req.headers['x-forwarded-for'] ||
      req.socket.remoteAddress ||
      'anonymous') as string

    const rateLimit = checkRateLimit(ip)
    if (!rateLimit.allowed) {
      return res.status(429).json({ error: rateLimit.error })
    }

    const { query, nickname } = req.body

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'INVALID_QUERY' })
    }

    if (query.length > 500) {
      return res.status(400).json({ error: 'QUERY_TOO_LONG' })
    }

    const result = await consultOracle(query, nickname)
    return res.json(result)
  } catch (err: any) {
    logger.error('Oracle critical error', err, { query: req.body?.query })
    return res.status(500).json({ error: 'SYSTEM_ERROR' })
  }
})

export default router
