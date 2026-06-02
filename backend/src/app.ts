import './utils/instrument.js'
import 'dotenv/config'
import express from 'express'
import * as Sentry from '@sentry/node'
import { initDb } from './utils/initDb.js'
import matchesRouter from './routes/matches.js'
import leaderboardRouter from './routes/leaderboard.js'
import liveRouter from './routes/live.js'
import predictionsRouter from './routes/predictions.js'
import aiRouter from './routes/analysis.js'
import usersRouter from './routes/users.js'
import feedbackRouter from './routes/feedback.js'
import oracleRouter from './routes/oracle.js'
import ascendRouter from './routes/ascend.js'
import festivalsRouter from './routes/festivals.js'

const app = express()

// Health check
app.get('/health', (_req, res) => res.status(200).send('OK'))

// CORS Middleware
const allowedOrigin = process.env.CORS_ORIGIN || '*'
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,POST,PUT,PATCH,DELETE,OPTIONS'
  )
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'false')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

app.set('trust proxy', 1) 
app.use(express.json())

// Route Registration
app.use('/api/matches', matchesRouter)
app.use('/api/leaderboard', leaderboardRouter)
app.use('/api/live', liveRouter)
app.use('/api/predictions', predictionsRouter)
app.use('/api/analysis', aiRouter)
app.use('/api/users', usersRouter)
app.use('/api/users/ascend', ascendRouter)
app.use('/api/feedback', feedbackRouter)
app.use('/api/oracle', oracleRouter)
app.use('/api/festivals', festivalsRouter)


// Sentry Error Handler
Sentry.setupExpressErrorHandler(app)

const PORT = process.env.PORT || 5000
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`)
  await initDb()
})

export default app
