import type { Match } from '../types/rps'

// Fallback conversion in case a raw timestamp reaches the frontend unnormalized.
// Under normal conditions all timestamps are normalized to milliseconds on ingest.
const toMs = (timestamp: number): number =>
  timestamp < 10_000_000_000 ? timestamp * 1000 : timestamp

// Formats a UTC millisecond timestamp as a human-readable date and time.
// Always displayed in UTC to match the API's timezone assumption.
export const formatDateTime = (timestamp: number): string => {
  return new Date(toMs(timestamp)).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Determines the result of a match from a specific player's perspective.
export const getPlayerResult = (
  match: Match,
  playerName: string
): 'WIN' | 'LOSE' => {
  const { playerA, playerB } = match
  const aWins =
    (playerA.played === 'ROCK' && playerB.played === 'SCISSORS') ||
    (playerA.played === 'SCISSORS' && playerB.played === 'PAPER') ||
    (playerA.played === 'PAPER' && playerB.played === 'ROCK')

  if (playerName === playerA.name) return aWins ? 'WIN' : 'LOSE'
  return aWins ? 'LOSE' : 'WIN'
}

// Maps a match result to its corresponding Tailwind background color class.
export const resultColor = (result: 'WIN' | 'LOSE'): string => {
  if (result === 'WIN') return 'bg-green-500'
  if (result === 'LOSE') return 'bg-red-500'
  return 'bg-orange-400'
}

export const formatPoints = (n: number): string => {
  if (n >= 1_000_000_000) {
    const val = n / 1_000_000_000
    return `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}B`
  }
  if (n >= 1_000_000) {
    const val = n / 1_000_000
    return `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}M`
  }
  return n.toLocaleString('en-US')
}

// Converts shorthand strings (400k, 1.5m, 2b) into raw integers.
export const parseShorthand = (val: string): number => {
  const clean = val.toLowerCase().replace(/,/g, '').trim();
  if (!clean) return 0;

  const num = parseFloat(clean);
  if (isNaN(num)) return 0;

  if (clean.endsWith('k')) return Math.floor(num * 1_000);
  if (clean.endsWith('m')) return Math.floor(num * 1_000_000);
  if (clean.endsWith('b')) return Math.floor(num * 1_000_000_000);

  return Math.floor(num);
}

export const formatTickerPoints = (n: number): string => {
  if (n >= 1_000_000_000) {
    const val = n / 1_000_000_000
    return `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}BIL`
  }
  if (n >= 1_000_000) {
    const val = n / 1_000_000
    return `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}MIL`
  }
  return n.toLocaleString('en-US')
}

export const getAmountColor = (amount?: number): string => {
  if (!amount) return 'text-gray-400'
  if (amount >= 50_000_000_000) return 'text-red-500'
  if (amount >= 1_000_000_000) return 'text-orange-500'
  if (amount >= 100_000_000) return 'text-yellow-500'
  if (amount >= 10_000_000) return 'text-purple-500'
  if (amount >= 1_000_000) return 'text-blue-500'
  return 'text-gray-400'
}