import pool from '../utils/db.js'
import { getWinner } from './matchService.js'
import type { Match, Move, PlayerStats } from '../types/rps.js'

const rowToMatch = (row: Record<string, unknown>): Match => ({
  type: row.type as string,
  gameId: row.game_id as string,
  time: Number(row.time),
  expiresAt: row.expires_at ? Number(row.expires_at) : Number(row.time),
  playerA: {
    name: row.player_a_name as string,
    played: row.player_a_played as Move
  },
  playerB: {
    name: row.player_b_name as string,
    played: row.player_b_played as Move
  }
})

// Computes win/loss tallies from a match list in memory rather than SQL
// because the leaderboard is already scoped to a small time window.
const buildLeaderboard = (matches: Match[]): PlayerStats[] => {
  const stats = new Map<string, PlayerStats>()

  const getOrCreate = (name: string): PlayerStats => {
    if (!stats.has(name))
      stats.set(name, { name, wins: 0, losses: 0, winRate: 0 })
    return stats.get(name)!
  }

  for (const match of matches) {
    const a = getOrCreate(match.playerA.name)
    const b = getOrCreate(match.playerB.name)
    if (getWinner(match) === 'A') {
      a.wins++
      b.losses++
    } else {
      b.wins++
      a.losses++
    }
  }

  return (
    [...stats.values()]
      .map((p) => ({
        ...p,
        winRate:
          p.wins + p.losses > 0
            ? Math.round((p.wins / (p.wins + p.losses)) * 100)
            : 0
      }))
      // Primary: most wins. Tiebreaker: alphabetical so order is deterministic.
      .sort((a, b) => b.wins - a.wins || a.name.localeCompare(b.name))
  )
}

export const getHistoricalLeaderboard = async (
  startDate?: string,
  endDate?: string
): Promise<PlayerStats[]> => {
  const params: unknown[] = []

  // Helper to build conditions with dynamic parameter indexing
  const buildConditions = () => {
    const conds: string[] = []
    if (startDate) {
      // We only push to params if they aren't already there for this specific segment
      // But it's cleaner to just build the whole list once and map the indexes
      conds.push(`time >= $${params.length + 1}`)
    }
    if (endDate) {
      conds.push(`time < $${params.length + 2}`)
    }
    return conds.length ? `WHERE ${conds.join(' AND ')}` : ''
  }

  // Proper way: Build the param list once, then use the same indices in both queries
  const values: any[] = []
  if (startDate) values.push(new Date(startDate).getTime())
  if (endDate) values.push(new Date(endDate).getTime() + 86400000)

  // Since the parameters are the same for both halves of the UNION,
  // we can use the same placeholders ($1, $2) in both SELECTs.
  const where = values.length
    ? `WHERE ${values.map((_, i) => `time ${i === 0 && startDate ? '>=' : '<'} $${i + 1}`).join(' AND ')}`
    : ''

  // Logic adjustment: If you have BOTH startDate and endDate, the map above needs
  // to be more explicit than just checking index.
  const explicitWhere = () => {
    const parts = []
    let i = 1
    if (startDate) parts.push(`time >= $${i++}`)
    if (endDate) parts.push(`time < $${i++}`)
    return parts.length ? `WHERE ${parts.join(' AND ')}` : ''
  }

  const finalWhere = explicitWhere()

  const query = `
    SELECT
      name,
      SUM(CASE WHEN won THEN 1 ELSE 0 END)::int AS wins,
      SUM(CASE WHEN NOT won THEN 1 ELSE 0 END)::int AS losses
    FROM (
      SELECT
        player_a_name AS name,
        (
          (player_a_played = 'ROCK'     AND player_b_played = 'SCISSORS') OR
          (player_a_played = 'SCISSORS' AND player_b_played = 'PAPER') OR
          (player_a_played = 'PAPER'    AND player_b_played = 'ROCK')
        ) AS won
      FROM matches ${finalWhere}
      UNION ALL
      SELECT
        player_b_name AS name,
        NOT (
          (player_a_played = 'ROCK'     AND player_b_played = 'SCISSORS') OR
          (player_a_played = 'SCISSORS' AND player_b_played = 'PAPER') OR
          (player_a_played = 'PAPER'    AND player_b_played = 'ROCK')
        ) AS won
      FROM matches ${finalWhere}
    ) results
    GROUP BY name
    ORDER BY wins DESC, name ASC`

  const result = await pool.query(query, values)

  return result.rows.map((row) => ({
    name: row.name as string,
    wins: row.wins,
    losses: row.losses,
    winRate:
      row.wins + row.losses > 0
        ? Math.round((row.wins / (row.wins + row.losses)) * 100)
        : 0
  }))
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
