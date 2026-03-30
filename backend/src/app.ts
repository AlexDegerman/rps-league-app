import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import matchesRouter from './routes/matches.js'
import { fetchAllMatches, startLiveStream } from './utils/apiClient.js'
import leaderboardRouter from './routes/leaderboard.js'
import liveRouter from './routes/live.js'

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

const PORT = process.env.PORT || 5000
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`)
  try {
    await fetchAllMatches()
    startLiveStream((match) => {
      console.log(`Live: ${match.playerA.name} vs ${match.playerB.name}`)
    })
  } catch (err) {
    console.error('Failed to initialize cache:', err)
  }
})

export default app
