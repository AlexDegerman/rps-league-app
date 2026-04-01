import { v4 as uuidv4 } from 'uuid'
import { playerNames } from './playerNames.js'
import { addMatch } from './apiClient.js'
import pool from './db.js'
import type { Match } from '../types/rps.js'

let currentPendingMatch: PendingMatch | null = null

export const getActivePendingMatch = () => currentPendingMatch

const MOVES = ['ROCK', 'PAPER', 'SCISSORS'] as const

const randomItem = <T>(arr: readonly T[]): T =>
  arr[Math.floor(Math.random() * arr.length)]!

const generateMatch = (): Match => {
  let playerA = randomItem(playerNames)
  let playerB = randomItem(playerNames)
  while (playerB === playerA) playerB = randomItem(playerNames)

  const moveA = randomItem(MOVES)
  let moveB = randomItem(MOVES)
  while (moveB === moveA) moveB = randomItem(MOVES)

  return {
    type: 'GAME_RESULT',
    gameId: uuidv4(),
    time: Date.now(),
    playerA: { name: playerA, played: moveA },
    playerB: { name: playerB, played: moveB }
  }
}

const saveMatch = async (match: Match): Promise<void> => {
  await pool.query(
    `INSERT INTO matches (game_id, type, time, player_a_name, player_a_played, player_b_name, player_b_played)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (game_id) DO NOTHING`,
    [
      match.gameId,
      match.type,
      match.time,
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
  intervalMs = 10000
): void => {
  setInterval(async () => {
    const match = generateMatch()

    const pendingMatch: PendingMatch = {
      gameId: match.gameId,
      time: match.time,
      playerA: match.playerA.name,
      playerB: match.playerB.name
    }

    currentPendingMatch = pendingMatch
    onPending(pendingMatch)

    await new Promise((resolve) => setTimeout(resolve, 5000))

    currentPendingMatch = null

    addMatch(match)
    await saveMatch(match)
    onResult(match)
  }, intervalMs)
}

export interface PendingMatch {
  gameId: string
  time: number
  playerA: string
  playerB: string
}
