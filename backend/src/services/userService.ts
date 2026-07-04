import pool from '../utils/db.js'
import { wordList } from '../utils/wordList.js'
import { logger } from '../utils/logger.js'
import { getCoarseLocation } from '../utils/geo.js'

const STARTING_POINTS = 200000n

// Generates a random 10-character alphanumeric fallback if a collision occurs
const generateRandomShortId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Creates user with 200k points on first visit, returns current points otherwise.
// Second SELECT after INSERT handles the race where ON CONFLICT DO NOTHING fires.
export const getOrCreateUser = async (
  userId: string,
  shortId: string,
  nickname?: string,
  ip?: string,
  utmSource?: string,
  referrer?: string | null
): Promise<{ points: bigint; nickname: string | null; shortId: string }> => {
  let currentShortId = shortId
  let attempts = 0
  const maxAttempts = 5

  while (attempts < maxAttempts) {
    try {
      const existing = await pool.query(
        `SELECT points, short_id, nickname FROM users WHERE user_id = $1`,
        [userId]
      )

      if (existing.rows.length > 0) {
        const row = existing.rows[0]

        if (!row.short_id && currentShortId) {
          await pool.query(
            `UPDATE users SET short_id = $1 WHERE user_id = $2`,
            [currentShortId, userId]
          )
        }

        if (!row.nickname && nickname) {
          await pool.query(
            `UPDATE users SET nickname = $1 WHERE user_id = $2`,
            [nickname, userId]
          )
          return {
            points: BigInt(row.points),
            nickname: nickname,
            shortId: row.short_id || currentShortId
          }
        }

        return {
          points: BigInt(row.points),
          nickname: row.nickname,
          shortId: row.short_id || currentShortId
        }
      }

      const { town: signupTown, country: signupCountry } = getCoarseLocation(ip)
      const recoveryCode = generateRecoveryCode()

      await pool.query(
        `INSERT INTO users (
            user_id, 
            short_id, 
            nickname, 
            points, 
            peak_points, 
            recovery_code,
            signup_town,
            signup_country,
            utm_source,
            signup_referrer
          )
          VALUES ($1, $2, $3, $4, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (user_id) DO NOTHING`,
        [
          userId,
          currentShortId,
          nickname ?? null,
          STARTING_POINTS.toString(),
          recoveryCode,
          signupTown,
          signupCountry,
          utmSource ?? null,
          referrer ?? null
        ]
      )

      const result = await pool.query(
        `SELECT points, nickname, short_id FROM users WHERE user_id = $1`,
        [userId]
      )

      logger.info('New user created', {
        userId,
        shortId: currentShortId,
        signupTown,
        signupCountry,
        utmSource,
        referrer
      })

      return {
        points: BigInt(result.rows[0].points),
        nickname: result.rows[0].nickname,
        shortId: result.rows[0].short_id
      }
    } catch (err: any) {
      // Check specifically for duplicate key violation on users_short_id_key unique index
      if (err.code === '23505' && err.constraint === 'users_short_id_key') {
        attempts++
        logger.warn(
          `short_id collision detected in getOrCreateUser on attempt ${attempts}. Retrying with a new short_id...`,
          {
            userId,
            collidingShortId: currentShortId
          }
        )
        currentShortId = generateRandomShortId()
        continue
      }
      logger.error('getOrCreateUser failed', err, {
        userId,
        shortId: currentShortId
      })
      throw err
    }
  }
  throw new Error(
    'getOrCreateUser: Max registration retry attempts exceeded due to short_id collisions'
  )
}

export const getUserPoints = async (
  userId: string,
  shortId: string,
  nickname?: string,
  ip?: string,
  utmSource?: string,
  referrer?: string | null
): Promise<{ points: bigint; nickname: string | null; shortId: string }> => {
  return getOrCreateUser(userId, shortId, nickname, ip, utmSource, referrer)
}

export const generateRecoveryCode = (): string => {
  const rand = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]!
  const num = Math.floor(Math.random() * 9000 + 1000)
  return `${rand(wordList)}-${rand(wordList)}-${num}`
}
