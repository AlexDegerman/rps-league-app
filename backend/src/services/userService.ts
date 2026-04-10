import pool from '../utils/db.js'
import { wordList } from '../utils/wordList.js'

const STARTING_POINTS = 200000n

// Creates user with 200k points on first visit, returns current points otherwise.
// Second SELECT after INSERT handles the race where ON CONFLICT DO NOTHING fires.
export const getOrCreateUser = async (
  userId: string,
  shortId: string,
  nickname?: string
): Promise<{ points: bigint; nickname: string | null }> => {
  const existing = await pool.query(
    `SELECT points, short_id, nickname FROM users WHERE user_id = $1`,
    [userId]
  )

  if (existing.rows.length > 0) {
    const row = existing.rows[0]

    if (!row.short_id && shortId) {
      await pool.query(`UPDATE users SET short_id = $1 WHERE user_id = $2`, [
        shortId,
        userId
      ])
    }

    if (!row.nickname && nickname) {
      await pool.query(`UPDATE users SET nickname = $1 WHERE user_id = $2`, [
        nickname,
        userId
      ])
      return {
        points: BigInt(row.points),
        nickname: nickname
      }
    }

    return {
      points: BigInt(row.points),
      nickname: row.nickname
    }
  }

  const recoveryCode = generateRecoveryCode()

  await pool.query(
    `INSERT INTO users (
        user_id, short_id, nickname, points, peak_points, recovery_code
      )
      VALUES ($1, $2, $3, $4, $4, $5)
      ON CONFLICT (user_id) DO NOTHING`,
    [
      userId,
      shortId,
      nickname ?? null,
      STARTING_POINTS.toString(),
      recoveryCode
    ]
  )

  const result = await pool.query(
    `SELECT points, nickname FROM users WHERE user_id = $1`,
    [userId]
  )

  return {
    points: BigInt(result.rows[0].points),
    nickname: result.rows[0].nickname
  }
}

export const getUserPoints = async (
  userId: string,
  shortId: string,
  nickname?: string
): Promise<{ points: bigint; nickname: string | null }> => {
  return getOrCreateUser(userId, shortId, nickname)
}
export const generateRecoveryCode = (): string => {
  const rand = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]!
  const num = Math.floor(Math.random() * 9000 + 1000)
  return `${rand(wordList)}-${rand(wordList)}-${num}`
}