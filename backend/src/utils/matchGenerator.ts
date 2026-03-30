import { v4 as uuidv4 } from 'uuid'
import { playerNames } from './playernames.js'
import { addMatch } from './apiClient.js'
import type { Match } from '../types/rps.js'

const MOVES = ['ROCK', 'PAPER', 'SCISSORS'] as const

const randomItem = <T>(arr: readonly T[]): T =>
  arr[Math.floor(Math.random() * arr.length)]!

const generateMatch = (): Match => {
  let playerA = randomItem(playerNames)
  let playerB = randomItem(playerNames)
  while (playerB === playerA) playerB = randomItem(playerNames)

  return {
    type: 'GAME_RESULT',
    gameId: uuidv4(),
    time: Date.now(),
    playerA: { name: playerA, played: randomItem(MOVES) },
    playerB: { name: playerB, played: randomItem(MOVES) }
  }
}

export const startMatchGenerator = (
  onMatch: (match: Match) => void,
  intervalMs = 5000
): void => {
  setInterval(() => {
    const match = generateMatch()
    addMatch(match)
    onMatch(match)
  }, intervalMs)
}
