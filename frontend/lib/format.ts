import type { Match } from '../types/rps'

// History matches use seconds (10 digits), live matches use milliseconds (13 digits)
const toMs = (timestamp: number): number =>
  timestamp < 10_000_000_000 ? timestamp * 1000 : timestamp

export const formatDateTime = (timestamp: number): string => {
  return new Date(toMs(timestamp)).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'UTC'
  })
}

export const getPlayerResult = (match: Match, playerName: string): 'WIN' | 'LOSE' | 'TIE' => {
  const { playerA, playerB } = match
  if (playerA.played === playerB.played) return 'TIE'
  const aWins =
    (playerA.played === 'ROCK' && playerB.played === 'SCISSORS') ||
    (playerA.played === 'SCISSORS' && playerB.played === 'PAPER') ||
    (playerA.played === 'PAPER' && playerB.played === 'ROCK')
  if (playerName === playerA.name) return aWins ? 'WIN' : 'LOSE'
  if (playerName === playerB.name) return aWins ? 'LOSE' : 'WIN'
  return 'TIE'
}

export const resultColor = (result: 'WIN' | 'LOSE' | 'TIE'): string => {
  if (result === 'WIN') return 'bg-green-500'
  if (result === 'LOSE') return 'bg-red-500'
  return 'bg-orange-400'
}