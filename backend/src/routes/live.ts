import { Router } from 'express'
import {
  startMatchGenerator,
  type PendingMatch
} from '../utils/matchGenerator.js'
import { resolvePrediction } from '../services/predictionService.js'
import type { Match } from '../types/rps.js'
import { getFlashEventForUser } from '../services/flashEventService.js'

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
type SSEClient = (event: string, data: string) => void
const clients = new Set<SSEClient>()

// Module-level flag — generator must only start once regardless of how many
// clients connect, since it drives real DB writes and SSE broadcasts.
let generatorStarted = false

const broadcast = (event: string, data: string) =>
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

  if (!generatorStarted) {
    generatorStarted = true

    startMatchGenerator(
      (pendingMatch: PendingMatch) => {
        broadcast('pending', JSON.stringify(pendingMatch))
      },
      async (match: Match) => {
        const winner =
          (match.playerA.played === 'ROCK' &&
            match.playerB.played === 'SCISSORS') ||
          (match.playerA.played === 'SCISSORS' &&
            match.playerB.played === 'PAPER') ||
          (match.playerA.played === 'PAPER' && match.playerB.played === 'ROCK')
            ? match.playerA.name
            : match.playerB.name

        // Resolve bets before broadcasting the result so clients get
        // prediction_result and result events in the correct order
        await resolvePrediction(match.gameId, winner, broadcast)
        broadcast('result', JSON.stringify(match))
      },
      broadcast
    )
  }

  req.on('close', () => clients.delete(send))
})

export default router
