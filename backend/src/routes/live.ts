import { Router } from 'express'
import { startMatchGenerator } from '../utils/matchGenerator.js'

const router = Router()
type SSEClient = (data: string) => void
const clients = new Set<SSEClient>()

let generatorStarted = false

router.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const send = (data: string) => res.write(`data: ${data}\n\n`)


  clients.add(send)

  if (!generatorStarted) {
    generatorStarted = true
    startMatchGenerator((match) => {
      clients.forEach((client) => client(JSON.stringify(match)))
    })
  }

  req.on('close', () => {

    clients.delete(send)
  })
})

export default router
