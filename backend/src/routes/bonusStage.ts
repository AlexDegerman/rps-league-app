import { Router, type Request, type Response } from 'express'
import pool from '../utils/db.js'
import * as bonusStageService from '../services/bonusStageService.js'
import { broadcast } from './live.js'
import { checkBonusAchievements } from '../services/achievementChecker.js'
import type { BonusSession } from '../types/bonusStage.js'

const router = Router()

function serializeSession(session: BonusSession) {
  return {
    id: session.id,
    stageType: session.stageType,
    isActive: session.isActive,
    accumulatedPayout: session.accumulatedPayout.toString(),
    lastBetAmount: session.lastBetAmount.toString(),
    stageStepsCompleted: session.stageStepsCompleted,
    maxSteps: session.maxSteps,
    gridState: session.gridState
  }
}

// GET /api/bonus/active
router.get('/active', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const session = await bonusStageService.getActiveSession(userId)
    if (!session) return res.json({ active: false })
    const reconnectData = bonusStageService.getReconnectData(session)
    return res.json({
      active: true,
      session: serializeSession(session),
      reconnectData
    })
  } catch (err) {
    console.error('[bonus/active]', err)
    return res.status(500).json({ error: 'Internal error' })
  }
})

// POST /api/bonus/action
router.post('/action', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string
  const { actionPayload } = req.body as {
    actionPayload: Record<string, unknown>
  }
  if (!userId || !actionPayload) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  try {
    const session = await bonusStageService.getActiveSession(userId)
    if (!session) return res.status(404).json({ error: 'No active session' })
    const updated = await bonusStageService.processAction(
      session,
      actionPayload
    )
    return res.json({ session: serializeSession(updated) })
  } catch (err) {
    console.error('[bonus/action]', err)
    return res.status(500).json({ error: 'Internal error' })
  }
})

// POST /api/bonus/claim
router.post('/claim', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const session = await bonusStageService.getActiveSession(userId)
    if (!session) return res.status(404).json({ error: 'No active session' })
    const userResult = await pool.query(
      'SELECT points FROM users WHERE user_id = $1',
      [userId]
    )
    const currentBalance = BigInt(String(userResult.rows[0]?.points ?? '0'))
    const finalPayout = await bonusStageService.claimWinnings(
      session,
      currentBalance
    )
    broadcast(
      'bonus_stage_completed',
      JSON.stringify({
        type: 'bonus_stage_completed',
        userId,
        finalPayout: finalPayout.toString(),
        stageType: session.stageType
      })
    )
    await checkBonusAchievements(userId, session, finalPayout)
    return res.json({ finalPayout: finalPayout.toString() })
  } catch (err) {
    console.error('[bonus/claim]', err)
    return res.status(500).json({ error: 'Internal error' })
  }
})

export default router
