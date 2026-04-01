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

router.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const send = (event: string, data: string) =>
    res.write(`event: ${event}\ndata: ${data}\n\n`)

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
        const aWins =
          (match.playerA.played === 'ROCK' &&
            match.playerB.played === 'SCISSORS') ||
          (match.playerA.played === 'SCISSORS' &&
            match.playerB.played === 'PAPER') ||
          (match.playerA.played === 'PAPER' && match.playerB.played === 'ROCK')

        const winner = aWins ? match.playerA.name : match.playerB.name

        await resolvePrediction(match.gameId, winner)

        clients.forEach((client) => client('result', JSON.stringify(match)))
      }
    )
  }

  req.on('close', () => {
    clients.delete(send)
  })
})

export default router
