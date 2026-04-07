import pool from '../utils/db.js'
import type { Match, Move } from '../types/rps.js'

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

// Shared winner logic used by both this service and leaderboardService
// to avoid duplicating the RPS outcome table.
export const getWinner = (match: Match): 'A' | 'B' => {
  const { played: a } = match.playerA
  const { played: b } = match.playerB
  if (
    (a === 'ROCK' && b === 'SCISSORS') ||
    (a === 'SCISSORS' && b === 'PAPER') ||
    (a === 'PAPER' && b === 'ROCK')
  )
    return 'A'
  return 'B'
}

export const getLatestMatches = async (page: number, limit: number) => {
  const offset = (page - 1) * limit
  const [data, count] = await Promise.all([
    pool.query(`SELECT * FROM matches ORDER BY time DESC LIMIT $1 OFFSET $2`, [
      limit,
      offset
    ]),
    pool.query(`SELECT COUNT(*) FROM matches`)
  ])
  const total = Number(count.rows[0].count)
  return {
    matches: data.rows.map(rowToMatch),
    total,
    hasMore: offset + limit < total
  }
}

export const getMatchesByDate = async (
  date: string,
  page: number,
  limit: number
): Promise<{ matches: Match[]; total: number; hasMore: boolean }> => {
  const offset = (page - 1) * limit
  const start = new Date(date).getTime()
  const end = start + 86400000

  const [data, count] = await Promise.all([
    pool.query(
      `SELECT * FROM matches WHERE time >= $1 AND time < $2 ORDER BY time DESC LIMIT $3 OFFSET $4`,
      [start, end, limit, offset]
    ),
    pool.query(`SELECT COUNT(*) FROM matches WHERE time >= $1 AND time < $2`, [
      start,
      end
    ])
  ])
  const total = Number(count.rows[0].count)
  return {
    matches: data.rows.map(rowToMatch),
    total,
    hasMore: offset + limit < total
  }
}

export const getMatchesByPlayer = async (
  name: string,
  page: number,
  limit: number
): Promise<{ matches: Match[]; total: number; hasMore: boolean }> => {
  const offset = (page - 1) * limit
  const [data, count] = await Promise.all([
    pool.query(
      `SELECT * FROM matches WHERE player_a_name = $1 OR player_b_name = $1 ORDER BY time DESC LIMIT $2 OFFSET $3`,
      [name, limit, offset]
    ),
    pool.query(
      `SELECT COUNT(*) FROM matches WHERE player_a_name = $1 OR player_b_name = $1`,
      [name]
    )
  ])
  const total = Number(count.rows[0].count)
  return {
    matches: data.rows.map(rowToMatch),
    total,
    hasMore: offset + limit < total
  }
}

export const getAllPlayerNames = async (): Promise<string[]> => {
  const result = await pool.query(
    `SELECT DISTINCT player_a_name AS name FROM matches
      UNION
      SELECT DISTINCT player_b_name AS name FROM matches
      ORDER BY name ASC`
  )
  return result.rows.map((r) => r.name as string)
}

export const getPlayerStats = async (name: string) => {
  const result = await pool.query(
    `SELECT * FROM matches WHERE player_a_name = $1 OR player_b_name = $1`,
    [name]
  )
  const matches = result.rows.map(rowToMatch)
  let wins = 0,
    losses = 0

  for (const m of matches) {
    const winner = getWinner(m)
    const playerWon =
      (winner === 'A' && m.playerA.name === name) ||
      (winner === 'B' && m.playerB.name === name)
    if (playerWon) wins++
    else losses++
  }

  return {
    total: matches.length,
    wins,
    losses,
    winRate: matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0
  }
}
