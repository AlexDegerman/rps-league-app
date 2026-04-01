import { v4 as uuidv4 } from 'uuid'
import { playerNames } from './playerNames.js'
import pool from './db.js' // Assuming apiClient logic is moving to db
import type { Match, Move } from '../types/rps.js'

let currentPendingMatch: PendingMatch | null = null

export const getActivePendingMatch = () => currentPendingMatch

const MOVES = ['ROCK', 'PAPER', 'SCISSORS'] as const

const randomItem = <T>(arr: readonly T[] | T[]): T =>
  arr[Math.floor(Math.random() * arr.length)]!

// Updated generateMatch to include expiresAt calculation
const generateMatch = (
  startTime: number,
  duration: number
): Match & { expiresAt: number } => {
  let playerA = randomItem(playerNames)
  let playerB = randomItem(playerNames)
  while (playerB === playerA) playerB = randomItem(playerNames)

  const moveA = randomItem(MOVES) as Move
  let moveB = randomItem(MOVES) as Move
  while (moveB === moveA) moveB = randomItem(MOVES) as Move

  return {
    type: 'GAME_RESULT',
    gameId: uuidv4(),
    time: startTime,
    expiresAt: startTime + duration, // Calculate the end of the betting window
    playerA: { name: playerA, played: moveA },
    playerB: { name: playerB, played: moveB }
  }
}

const saveMatch = async (
  match: Match & { expiresAt: number }
): Promise<void> => {
  await pool.query(
    `INSERT INTO matches (game_id, type, time, expires_at, player_a_name, player_a_played, player_b_name, player_b_played)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (game_id) DO NOTHING`,
    [
      match.gameId,
      match.type,
      match.time,
      match.expiresAt, // New column
      match.playerA.name,
      match.playerA.played,
      match.playerB.name,
      match.playerB.played
    ]
  )
}

export const startMatchGenerator = (
  onPending: (pendingMatch: PendingMatch) => void,
  onResult: (match: Match) => void,
  intervalMs = 15000 // Increased slightly so there is a gap between matches
): void => {
  setInterval(async () => {
    const BETTING_DURATION = 5000
    const startTime = Date.now()

    // 1. Generate the match with a fixed expiration time
    const match = generateMatch(startTime, BETTING_DURATION)

    const pendingMatch: PendingMatch = {
      gameId: match.gameId,
      time: match.time,
      expiresAt: match.expiresAt, // Include expiration for the frontend
      playerA: match.playerA.name,
      playerB: match.playerB.name
    }

    currentPendingMatch = pendingMatch
    onPending(pendingMatch)

    // 2. Wait for the betting window to expire
    await new Promise((resolve) => setTimeout(resolve, BETTING_DURATION))

    // 3. Resolve match
    currentPendingMatch = null

    await saveMatch(match)
    onResult(match)
  }, intervalMs)
}

export interface PendingMatch {
  gameId: string
  time: number
  expiresAt: number // Required for client-side sync
  playerA: string
  playerB: string
}
