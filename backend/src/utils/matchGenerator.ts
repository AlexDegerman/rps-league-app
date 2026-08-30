import { v4 as uuidv4 } from 'uuid'
import { playerNames } from '../constants/playerNames.js'
import pool from './db.js'
import type { Match, Move } from '../types/rps.js'
import { logger } from '../utils/logger.js'

export interface PendingMatch {
  gameId: string
  time: number
  expiresAt: number
  playerA: string
  playerB: string
}

// Keep the active match in memory for real-time access without a DB query
let currentPendingMatch: PendingMatch | null = null
export const getActivePendingMatch = () => currentPendingMatch

// Prevent duplicate generator loops within this module instance
let isRunning = false
let timer: ReturnType<typeof setTimeout> | null = null

const MOVES = ['ROCK', 'PAPER', 'SCISSORS'] as const
const randomItem = <T>(arr: readonly T[] | T[]): T =>
  arr[Math.floor(Math.random() * arr.length)]!

const generateMatch = (
  startTime: number,
  duration: number
): Match & { expiresAt: number } => {
  let playerA = randomItem(playerNames)
  let playerB = randomItem(playerNames)
  // Ensure players are distinct
  while (playerB === playerA) playerB = randomItem(playerNames)

  const moveA = randomItem(MOVES) as Move
  let moveB = randomItem(MOVES) as Move
  // Exclude ties by design
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
  try {
    await pool.query(
      `INSERT INTO matches (game_id, type, time, expires_at, player_a_name, player_a_played, player_b_name, player_b_played)
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
  } catch (err) {
    logger.error('saveMatch failed', err, { gameId: match.gameId })
    throw err // re-throw - if match isn't saved, betting window is invalid
  }
}

export const startMatchGenerator = (
  onPending: (pendingMatch: PendingMatch) => void,
  onResult: (match: Match) => void | Promise<void>,
  intervalMs = 5000
): (() => void) => {
  if (isRunning) {
    logger.warn(
      'Match generator is already running within this module instance.'
    )
    return () => {}
  }
  isRunning = true

  const tick = async () => {
    const BETTING_DURATION = 3000
    const startTime = Date.now()

    try {
      const match = generateMatch(startTime, BETTING_DURATION)

      // Persist match record before notifying clients to prevent prediction validation races
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

      // Wait for the betting period to expire
      await new Promise((resolve) => setTimeout(resolve, BETTING_DURATION))

      currentPendingMatch = null

      // Await downstream async processing to ensure strict sequential execution
      await onResult(match)
    } catch (err) {
      logger.error('matchGenerator: tick failed', err, {
        tick: startTime
      })
      currentPendingMatch = null
    } finally {
      if (isRunning) {
        // Compensate for tick execution time to maintain the target interval
        // If the tick overruns, start the next tick immediately
        const elapsed = Date.now() - startTime
        const nextDelay = Math.max(0, intervalMs - elapsed)

        timer = setTimeout(tick, nextDelay)
      }
    }
  }

  timer = setTimeout(tick, 0)

  // Return a cleanup function to allow test runners to isolate execution
  return () => {
    isRunning = false

    if (timer) {
      clearTimeout(timer)
      timer = null
    }

    currentPendingMatch = null
  }
}
