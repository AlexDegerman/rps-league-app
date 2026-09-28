import './utils/instrument.js'
import 'dotenv/config'
import express from 'express'
import * as Sentry from '@sentry/node'
import matchesRouter from './routes/matches.js'
import leaderboardRouter from './routes/leaderboard.js'
import liveRouter from './routes/live.js'
import predictionsRouter from './routes/predictions.js'
import usersRouter from './routes/users.js'
import ascendRouter from './routes/ascend.js'
import festivalsRouter from './routes/festivals.js'
import achievementsRouter from './routes/achievements.js'
import relicRouter from './routes/relics.js'
import globaleventsRouter from './routes/globalevents.js'
import worldbossRouter from './routes/worldboss.js'
import bonusStageRouter from './routes/bonusStage.js'
import identityRouter from './routes/identity.js'
import oracleRouter from './routes/oracle.js' 

const app = express()

// Health check
app.get('/health', (_req, res) => res.status(200).send('OK'))

// CORS Middleware
const allowedOrigins = [
  'https://rpsleague.fi',
  'https://network.rpsleague.fi',
  'https://daily.rpsleague.fi',
  'http://localhost:3000'
]
app.use((req, res, next) => {
  const origin = req.headers.origin
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  } else {
    res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || 'https://rpsleague.fi')
  }
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,POST,PUT,PATCH,DELETE,OPTIONS'
  )
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type,Authorization,x-admin-key,x-user-id,x-internal-secret'
  )
  res.setHeader('Access-Control-Allow-Credentials', 'true')
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
app.use('/api/users', usersRouter)
app.use('/api/ascend', ascendRouter)
app.use('/api/festivals', festivalsRouter)
app.use('/api/achievements', achievementsRouter)
app.use('/api/relics', relicRouter)
app.use('/api/globalevents', globaleventsRouter)
app.use('/api/worldboss', worldbossRouter)
app.use('/api/bonus', bonusStageRouter)
app.use('/api/identity', identityRouter)
app.use('/api/oracle', oracleRouter)

// Sentry Error Handler
Sentry.setupExpressErrorHandler(app)

const PORT = process.env.PORT || 5000
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`)
})

export default app
