import { fetchAllMatches } from '../utils/apiClient.js'
import type { Match } from '../types/rps.js'

export const getWinner = (match: Match): 'A' | 'B' | 'TIE' => {
  const a = match.playerA.played.toUpperCase()
  const b = match.playerB.played.toUpperCase()
  if (a === b) return 'TIE'
  if (
    (a === 'ROCK' && b === 'SCISSORS') ||
    (a === 'SCISSORS' && b === 'PAPER') ||
    (a === 'PAPER' && b === 'ROCK')
  )
    return 'A'
  // anything unrecognized (like "dog"), treat as loss for that player
  // if both unrecognized it's effectively a tie
  if (a !== 'ROCK' && a !== 'PAPER' && a !== 'SCISSORS') return 'B'
  if (b !== 'ROCK' && b !== 'PAPER' && b !== 'SCISSORS') return 'A'
  return 'B'
}

export const getLatestMatches = async (page: number, limit: number) => {
  const all = await fetchAllMatches()
  const sorted = [...all].sort(
    (a, b) => (b.time as number) - (a.time as number)
  )
  const start = (page - 1) * limit
  return {
    matches: sorted.slice(start, start + limit),
    total: sorted.length,
    hasMore: start + limit < sorted.length
  }
}

export const getMatchesByDate = async (
  date: string,
  page: number,
  limit: number
): Promise<{
  matches: Match[]
  total: number
  hasMore: boolean
}> => {
  const all = await fetchAllMatches()
  const filtered = all
    .filter(
      (m) => new Date(m.time as number).toISOString().split('T')[0] === date
    )
    .sort((a, b) => (b.time as number) - (a.time as number))
  const start = (page - 1) * limit
  return {
    matches: filtered.slice(start, start + limit),
    total: filtered.length,
    hasMore: start + limit < filtered.length
  }
}

export const getMatchesByPlayer = async (
  name: string,
  page: number,
  limit: number
): Promise<{
  matches: Match[]
  total: number
  hasMore: boolean
}> => {
  const all = await fetchAllMatches()
  const filtered = all
    .filter((m) => m.playerA.name === name || m.playerB.name === name)
    .sort((a, b) => (b.time as number) - (a.time as number))
  const start = (page - 1) * limit
  return {
    matches: filtered.slice(start, start + limit),
    total: filtered.length,
    hasMore: start + limit < filtered.length
  }
}

// Returns sorted unique player names for the search dropdown
export const getAllPlayerNames = async (): Promise<string[]> => {
  const all = await fetchAllMatches()
  const names = new Set<string>()
  for (const m of all) {
    names.add(m.playerA.name)
    names.add(m.playerB.name)
  }
  return [...names].sort()
}

export const getPlayerStats = async (
  name: string
): Promise<{
  total: number
  wins: number
  losses: number
  ties: number
  winRate: number
}> => {
  const all = await fetchAllMatches()
  const matches = all.filter(
    (m) => m.playerA.name === name || m.playerB.name === name
  )
  let wins = 0,
    losses = 0,
    ties = 0
  for (const m of matches) {
    const winner = getWinner(m)
    if (winner === 'TIE') ties++
    else if (
      (winner === 'A' && m.playerA.name === name) ||
      (winner === 'B' && m.playerB.name === name)
    )
      wins++
    else losses++
  }
  return {
    total: matches.length,
    wins,
    losses,
    ties,
    winRate: matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0
  }
}
