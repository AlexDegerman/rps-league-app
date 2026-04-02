import { Router } from 'express'
import {
  startMatchGenerator,
  type PendingMatch
} from '../utils/matchGenerator.js'
import { resolvePrediction } from '../services/predictionService.js'
import type { Match } from '../types/rps.js'

const router = Router()
type SSEClient = (event: string, data: string) => void
const clients = new Set<SSEClient>()
let generatorStarted = false

// Handle CORS preflight
router.options('/', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.sendStatus(204) // No Content
})

router.get('/', (req, res) => {
  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  res.flushHeaders()

  const send = (event: string, data: string) =>
    res.write(`event: ${event}\ndata: ${data}\n\n`)

  send('sync', JSON.stringify({ serverTime: Date.now() }))

  clients.add(send)

  if (!generatorStarted) {
    generatorStarted = true
    startMatchGenerator(
      (pendingMatch: PendingMatch) => {
        clients.forEach((client) =>
          client('pending', JSON.stringify(pendingMatch))
        )
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

        await resolvePrediction(match.gameId, winner, (event, data) => {
          clients.forEach((client) => client(event, data))
        })
        clients.forEach((client) => client('result', JSON.stringify(match)))
      }
    )
  }

  req.on('close', () => {
    clients.delete(send)
  })
})

export default router
