import pool from '../utils/db.js'
import { getWinner } from './matchService.js'
import { logger } from '../utils/logger.js'
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

// Tallies wins/losses from an in-memory match list rather than SQL aggregation.
// Acceptable because callers already scope the query to a small time window.
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
      // Primary sort: most wins. Tiebreaker: alphabetical for deterministic ordering.
      .sort((a, b) => b.wins - a.wins || a.name.localeCompare(b.name))
  )
}

export const getHistoricalLeaderboard = async (
  startDate?: string,
  endDate?: string
): Promise<PlayerStats[]> => {
  // Build query params and WHERE clause together so indices always stay in sync.
  // endDate is treated as inclusive, so we add one full day in ms.
  const values: unknown[] = []
  const conditions: string[] = []

  if (startDate) {
    values.push(new Date(startDate).getTime())
    conditions.push(`time >= $${values.length}`)
  }
  if (endDate) {
    values.push(new Date(endDate).getTime() + 86_400_000)
    conditions.push(`time < $${values.length}`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  // UNION ALL covers both sides of each match (player A and player B) so a
  // single GROUP BY gives the full win/loss record for every player.
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
          (player_a_played = 'SCISSORS' AND player_b_played = 'PAPER')    OR
          (player_a_played = 'PAPER'    AND player_b_played = 'ROCK')
        ) AS won
      FROM matches ${where}
      UNION ALL
      SELECT
        player_b_name AS name,
        NOT (
          (player_a_played = 'ROCK'     AND player_b_played = 'SCISSORS') OR
          (player_a_played = 'SCISSORS' AND player_b_played = 'PAPER')    OR
          (player_a_played = 'PAPER'    AND player_b_played = 'ROCK')
        ) AS won
      FROM matches ${where}
    ) results
    GROUP BY name
    ORDER BY wins DESC, name ASC`

  try {
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
  } catch (err) {
    logger.error('getHistoricalLeaderboard failed', err, { startDate, endDate })
    throw err
  }
}

// Delegates to buildLeaderboard rather than SQL aggregation, today's window
// is small enough that the in-memory tally is fast and simpler to maintain.
export const getTodayLeaderboard = async (): Promise<PlayerStats[]> => {
  const start = new Date().setUTCHours(0, 0, 0, 0)
  const end = start + 86_400_000

  try {
    const result = await pool.query(
      `SELECT * FROM matches WHERE time >= $1 AND time < $2`,
      [start, end]
    )
    return buildLeaderboard(result.rows.map(rowToMatch))
  } catch (err) {
    logger.error('getTodayLeaderboard failed', err)
    throw err
  }
}
