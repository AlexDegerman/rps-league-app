import pool from '../utils/db.js'
import { logger } from '../utils/logger.js'
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
  try {
    const offset = (page - 1) * limit
    const data = await pool.query(
      `SELECT * FROM matches ORDER BY time DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    )
    return {
      matches: data.rows.map(rowToMatch),
      hasMore: data.rows.length === limit
    }
  } catch (err) {
    logger.error('getLatestMatches failed', err, { page, limit })
    throw err
  }
}

export const getMatchesByDate = async (
  date: string,
  page: number,
  limit: number
): Promise<{ matches: Match[]; total: number; hasMore: boolean }> => {
  try {
    const offset = (page - 1) * limit
    const start = new Date(date).getTime()
    const end = start + 86400000
    const [data, count] = await Promise.all([
      pool.query(
        `SELECT * FROM matches WHERE time >= $1 AND time < $2 ORDER BY time DESC LIMIT $3 OFFSET $4`,
        [start, end, limit, offset]
      ),
      pool.query(
        `SELECT COUNT(*) FROM matches WHERE time >= $1 AND time < $2`,
        [start, end]
      )
    ])
    const total = Number(count.rows[0].count)
    return {
      matches: data.rows.map(rowToMatch),
      total,
      hasMore: offset + limit < total
    }
  } catch (err) {
    logger.error('getMatchesByDate failed', err, { date, page, limit })
    throw err
  }
}

export const getMatchesByPlayer = async (
  name: string,
  page: number,
  limit: number
): Promise<{ matches: Match[]; total: number; hasMore: boolean }> => {
  try {
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
  } catch (err) {
    logger.error('getMatchesByPlayer failed', err, { name, page, limit })
    throw err
  }
}

export const getAllPlayerNames = async (): Promise<string[]> => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT player_a_name AS name FROM matches
        UNION
        SELECT DISTINCT player_b_name AS name FROM matches
        ORDER BY name ASC`
    )
    return result.rows.map((r) => r.name as string)
  } catch (err) {
    logger.error('getAllPlayerNames failed', err)
    throw err
  }
}

export const getPlayerStats = async (name: string) => {
  try {
    const result = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE
          (player_a_name = $1 AND ((player_a_played='ROCK' AND player_b_played='SCISSORS') OR (player_a_played='SCISSORS' AND player_b_played='PAPER') OR (player_a_played='PAPER' AND player_b_played='ROCK')))
          OR
          (player_b_name = $1 AND NOT ((player_a_played='ROCK' AND player_b_played='SCISSORS') OR (player_a_played='SCISSORS' AND player_b_played='PAPER') OR (player_a_played='PAPER' AND player_b_played='ROCK')))
        )::int AS wins,
        COUNT(*) FILTER (WHERE player_a_name = $1 OR player_b_name = $1)::int AS total
      FROM matches`,
      [name]
    )

    const { wins, total } = result.rows[0]
    const losses = total - wins

    return {
      total,
      wins,
      losses,
      winRate: total > 0 ? Math.round((wins / total) * 100) : 0
    }
  } catch (err) {
    logger.error('getPlayerStats failed', err, { name })
    throw err
  }
}