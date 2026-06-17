import { Router } from 'express'
import {
  startMatchGenerator,
  type PendingMatch
} from '../utils/matchGenerator.js'
import { resolvePrediction } from '../services/predictionService.js'
import type { Match } from '../types/rps.js'
import { getFlashEventForUser } from '../services/flashEventService.js'
import { logger } from '../utils/logger.js'
import {
  startDemoFestivalScheduler,
  getActiveFestival,
  getFestivalLockoutRemaining
} from '../services/festivalService.js'
import { getGlobalEventState, startGlobalEventScheduler } from '../services/globalEventService.js'

const router = Router()

router.get('/flash-state', (req, res) => {
  const { userId } = req.query
  if (!userId || typeof userId !== 'string') {
    return res.json(null)
  }
  const event = getFlashEventForUser(userId)
  res.json(
    event
      ? {
          type: event.type,
          betsRemaining: event.betsRemaining,
          multiplier: event.multiplier
        }
      : null
  )
})

router.get('/festival-state', (req, res) => {
  const festival = getActiveFestival()
  const lockoutRemaining = getFestivalLockoutRemaining()
  res.json({
    festival: festival
      ? {
          type: festival.type,
          triggeredBy: festival.triggeredBy,
          startedAt: festival.startedAt,
          endsAt: festival.endsAt
        }
      : null,
    lockoutRemaining
  })
})

router.get('/global-event-state', (_req, res) => {
  res.json(getGlobalEventState())
})


type SSEClient = (event: string, data: string) => void
const clients = new Set<SSEClient>()

// Module-level flag - generator must only start once regardless of how many
// clients connect, since it drives real DB writes and SSE broadcasts.
let generatorStarted = false

export const broadcast = (event: string, data: string) => 
  clients.forEach((client) => client(event, data))


router.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  res.setHeader('Connection', 'keep-alive')
  // Disables Nginx response buffering so events reach the client immediately
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  const send: SSEClient = (event, data) =>
    res.write(`event: ${event}\ndata: ${data}\n\n`)

  // Sync client clock on connect so countdown timers stay accurate
  send('sync', JSON.stringify({ serverTime: Date.now() }))
  clients.add(send)
  logger.info('SSE client connected', { clientCount: clients.size })

  if (!generatorStarted) {
    generatorStarted = true
    logger.info('Match generator started', { clientCount: clients.size })

    startMatchGenerator(
      (pendingMatch: PendingMatch) => {
        broadcast('pending', JSON.stringify(pendingMatch))
      },
      async (match: Match) => {
        try {
          const winner =
            (match.playerA.played === 'ROCK' &&
              match.playerB.played === 'SCISSORS') ||
            (match.playerA.played === 'SCISSORS' &&
              match.playerB.played === 'PAPER') ||
            (match.playerA.played === 'PAPER' &&
              match.playerB.played === 'ROCK')
              ? match.playerA.name
              : match.playerB.name

          // Resolve bets before broadcasting the result so clients get
          // prediction_result and result events in the correct order
          await resolvePrediction(match.gameId, winner, broadcast)
          broadcast('result', JSON.stringify(match))
        } catch (err) {
          logger.error('SSE: resolvePrediction threw in match handler', err, {
            gameId: match.gameId
          })
        }
      },
      broadcast
    )
    startDemoFestivalScheduler(broadcast)
    startGlobalEventScheduler(broadcast)
  }

  req.on('close', () => {
    clients.delete(send)
    logger.info('SSE client disconnected', { clientCount: clients.size })
  })
})

export default router
