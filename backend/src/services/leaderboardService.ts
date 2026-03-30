import pool from '../utils/db.js'
import { getWinner } from './matchService.js'
import type { Match, Move } from '../types/rps.js'

export interface PlayerStats {
  name: string
  wins: number
  losses: number
  ties: number
  winRate: number
}

const rowToMatch = (row: Record<string, unknown>): Match => ({
  type: row.type as string,
  gameId: row.game_id as string,
  time: Number(row.time),
  playerA: {
    name: row.player_a_name as string,
    played: row.player_a_played as Move
  },
  playerB: {
    name: row.player_b_name as string,
    played: row.player_b_played as Move
  }
})

// Aggregates match results into per-player win/loss/tie counts and win rate.
// Sorted by wins descending, with alphabetical name as tiebreaker.
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
  const conditions: string[] = []
  const params: unknown[] = []

  if (startDate) {
    params.push(new Date(startDate).getTime())
    conditions.push(`time >= $${params.length}`)
  }
  if (endDate) {
    params.push(new Date(endDate).getTime() + 86400000)
    conditions.push(`time < $${params.length}`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const result = await pool.query(`SELECT * FROM matches ${where}`, params)
  return buildLeaderboard(result.rows.map(rowToMatch))
}

export const getTodayLeaderboard = async (): Promise<PlayerStats[]> => {
  const start = new Date().setUTCHours(0, 0, 0, 0)
  const end = start + 86400000
  const result = await pool.query(
    `SELECT * FROM matches WHERE time >= $1 AND time < $2`,
    [start, end]
  )
  return buildLeaderboard(result.rows.map(rowToMatch))
}
