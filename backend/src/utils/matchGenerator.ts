import { v4 as uuidv4 } from 'uuid'
import { playerNames } from './playerNames.js'
import pool from './db.js'
import type { Match, Move } from '../types/rps.js'

export interface PendingMatch {
  gameId: string
  time: number
  expiresAt: number
  playerA: string
  playerB: string
}

// Module-level so any route can query the live match without a DB round-trip
let currentPendingMatch: PendingMatch | null = null
export const getActivePendingMatch = () => currentPendingMatch

const MOVES = ['ROCK', 'PAPER', 'SCISSORS'] as const
const randomItem = <T>(arr: readonly T[] | T[]): T =>
  arr[Math.floor(Math.random() * arr.length)]!

const generateMatch = (
  startTime: number,
  duration: number
): Match & { expiresAt: number } => {
  let playerA = randomItem(playerNames)
  let playerB = randomItem(playerNames)
  // Re-roll until players are distinct
  while (playerB === playerA) playerB = randomItem(playerNames)

  const moveA = randomItem(MOVES) as Move
  let moveB = randomItem(MOVES) as Move
  // Re-roll until moves differ - ties are excluded by design
  while (moveB === moveA) moveB = randomItem(MOVES) as Move

  return {
    type: 'GAME_RESULT',
    gameId: uuidv4(),
    time: startTime,
    expiresAt: startTime + duration,
    playerA: { name: playerA, played: moveA },
    playerB: { name: playerB, played: moveB }
  }
}

// Persists match before broadcasting so predictions can validate against it
const saveMatch = async (
  match: Match & { expiresAt: number }
): Promise<void> => {
  await pool.query(
    `INSERT INTO matches (game_id, type, time, expires_at, player_a_name, player_a_played,      player_b_name, player_b_played)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (game_id) DO NOTHING`,
    [
      match.gameId,
      match.type,
      match.time,
      match.expiresAt,
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
  broadcast: (event: string, data: string) => void,
  intervalMs = 5000
): void => {
  setInterval(async () => {
    const BETTING_DURATION = 3000
    const startTime = Date.now()
    const match = generateMatch(startTime, BETTING_DURATION)
    await saveMatch(match)
    const pendingMatch: PendingMatch = {
      gameId: match.gameId,
      time: match.time,
      expiresAt: match.expiresAt,
      playerA: match.playerA.name,
      playerB: match.playerB.name
    }
    currentPendingMatch = pendingMatch
    onPending(pendingMatch)
    await new Promise((resolve) => setTimeout(resolve, BETTING_DURATION))
    currentPendingMatch = null
    onResult(match)
  }, intervalMs)
}