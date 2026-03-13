import { fetchAllMatches } from '../utils/apiClient.js'
import type { Match } from '../types/rps.js'

export const getLatestMatches = async (page: number, limit: number): Promise<{
  matches: Match[]
  total: number
  hasMore: boolean
}> => {
  const all = await fetchAllMatches()
  const start = (page - 1) * limit
  return {
    matches: all.slice(start, start + limit),
    total: all.length,
    hasMore: start + limit < all.length
  }
}

export const getWinner = (match: Match): 'A' | 'B' | 'TIE' => {
  const a = match.playerA.played.toUpperCase()
  const b = match.playerB.played.toUpperCase()
  if (a === b) return 'TIE'
  if (
    (a === 'ROCK' && b === 'SCISSORS') ||
    (a === 'SCISSORS' && b === 'PAPER') ||
    (a === 'PAPER' && b === 'ROCK')
  ) return 'A'
  // anything unrecognized (like "dog"), treat as loss for that player
  // if both unrecognized it's effectively a tie
  if (a !== 'ROCK' && a !== 'PAPER' && a !== 'SCISSORS') return 'B'
  if (b !== 'ROCK' && b !== 'PAPER' && b !== 'SCISSORS') return 'A'
  return 'B'
}

export const getMatchesByDate = async (date: string, page: number, limit: number): Promise<{
  matches: Match[]
  total: number
  hasMore: boolean
}> => {
  const all = await fetchAllMatches()
  const filtered = all
    .filter(m => new Date(m.time as number).toISOString().split('T')[0] === date)
    .sort((a, b) => (b.time as number) - (a.time as number))
  const start = (page - 1) * limit
  return {
    matches: filtered.slice(start, start + limit),
    total: filtered.length,
    hasMore: start + limit < filtered.length
  }
}