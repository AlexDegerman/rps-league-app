import { fetchAllMatches } from '../utils/apiClient.js'
import { getWinner } from './matchService.js'
import type { Match } from '../types/rps.js'

export interface PlayerStats {
  name: string
  wins: number
  losses: number
  ties: number
  winRate: number
}

const buildLeaderboard = (matches: Match[]): PlayerStats[] => {
  const stats = new Map<string, PlayerStats>()

  const getOrCreate = (name: string): PlayerStats => {
    if (!stats.has(name))
      stats.set(name, { name, wins: 0, losses: 0, ties: 0, winRate: 0 })
    return stats.get(name)!
  }

  for (const match of matches) {
    const a = getOrCreate(match.playerA.name)
    const b = getOrCreate(match.playerB.name)
    const winner = getWinner(match)

    if (winner === 'TIE') {
      a.ties++
      b.ties++
    } else if (winner === 'A') {
      a.wins++
      b.losses++
    } else {
      b.wins++
      a.losses++
    }
  }

  return [...stats.values()]
    .map((p) => ({
      ...p,
      winRate:
        p.wins + p.losses + p.ties > 0
          ? Math.round((p.wins / (p.wins + p.losses + p.ties)) * 100)
          : 0
    }))
    .sort((a, b) => b.wins - a.wins || a.name.localeCompare(b.name))
}

// Historical leaderboard, filter by date range, both dates optional
export const getHistoricalLeaderboard = async (
  startDate?: string,
  endDate?: string
): Promise<PlayerStats[]> => {
  const all = await fetchAllMatches()
  const filtered = all.filter((match) => {
    const date = new Date(match.time).toISOString().split('T')[0] ?? ''
    if (startDate && date < startDate) return false
    if (endDate && date > endDate) return false
    return true
  })
  return buildLeaderboard(filtered)
}

export const getTodayLeaderboard = async (): Promise<PlayerStats[]> => {
  const all = await fetchAllMatches()
  const today = new Date().toISOString().split('T')[0]
  const todayMatches = all.filter(
    (m) => new Date(m.time as number).toISOString().split('T')[0] === today
  )
  return buildLeaderboard(todayMatches)
}
