import 'dotenv/config'
import express from 'express'
import matchesRouter from './routes/matches.js'
import leaderboardRouter from './routes/leaderboard.js'
import liveRouter from './routes/live.js'
import predictionsRouter from './routes/predictions.js'
import aiRouter from './routes/analysis.js'
import { initDb } from './utils/initDb.js'
import usersRouter from './routes/users.js'

const app = express()

app.get('/health', (_req, res) => res.status(200).send('OK'))

const allowedOrigin = process.env.CORS_ORIGIN || '*'

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,POST,PUT,PATCH,DELETE,OPTIONS'
  )
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'false')
  // Preflight — browsers send OPTIONS before cross-origin POST/PUT
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

app.use(express.json())

app.use('/api/matches', matchesRouter)
app.use('/api/leaderboard', leaderboardRouter)
app.use('/api/live', liveRouter)
app.use('/api/predictions', predictionsRouter)
app.use('/api/analysis', aiRouter)
app.use('/api/users', usersRouter)

const PORT = process.env.PORT || 5000
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`)
  await initDb()
})

export default app
