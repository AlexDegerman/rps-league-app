import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import matchesRouter from './routes/matches.js'
import leaderboardRouter from './routes/leaderboard.js'
import liveRouter from './routes/live.js'
import { initDb } from './utils/initDb.js'
import predictionsRouter from './routes/predictions.js'

const app = express()

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
  })
)
app.use(express.json())

app.use('/api/matches', matchesRouter)
app.use('/api/leaderboard', leaderboardRouter)
app.use('/api/live', liveRouter)
app.use('/api/predictions', predictionsRouter)

const PORT = process.env.PORT || 5000
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`)
  await initDb()
})

export default app
