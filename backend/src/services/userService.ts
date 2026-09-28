import pool from '../utils/db.js'
import { logger } from '../utils/logger.js'
import { getCoarseLocation } from '../utils/geo.js'
import { STARTING_POINTS } from '../constants/prediction.js'

// Syncs Arkalon Core identity into local game storage.
// Satellite apps never create identities or recovery credentials.
export const getOrCreateUser = async (
 userId: string, // Core identity ID from Network
  shortId: string, // Core short ID from Network
  nickname: string, // Core nickname from Network
  ip?: string,
  utmSource?: string,
  referrer?: string | null
): Promise<{ points: bigint; nickname: string | null; shortId: string }> => {
  try {
    // Return existing local game state
    const existing = await pool.query(
      `SELECT points, short_id, nickname FROM users WHERE user_id = $1`,
      [userId]
    )

    if (existing.rows.length > 0) {
      const row = existing.rows[0]
      return {
        points: BigInt(row.points),
        nickname: row.nickname,
        shortId: row.short_id || shortId
      }
    }

    // Get coarse location for analytics
    const { town: signupTown, country: signupCountry } = getCoarseLocation(ip)

    await pool.query(
      `INSERT INTO users (
      user_id, 
      short_id, 
      nickname, 
      points, 
      peak_points,
      signup_town,
      signup_country,
      utm_source,
      signup_referrer
    )
    VALUES ($1, $2, $3, $4, $4, $5, $6, $7, $8)
    ON CONFLICT (user_id) DO UPDATE SET 
      short_id = COALESCE(users.short_id, EXCLUDED.short_id),
      nickname = COALESCE(users.nickname, EXCLUDED.nickname)`,
      [
        userId,
        shortId,
        nickname,
        STARTING_POINTS.toString(),
        signupTown,
        signupCountry,
        utmSource ?? null,
        referrer ?? null
      ]
    )

    logger.info('New user provisioned from Arkalon Network', {
      userId,
      shortId,
      signupTown,
      signupCountry,
      utmSource
    })

    return {
      points: BigInt(STARTING_POINTS),
      nickname,
      shortId
    }
  } catch (err: unknown) {
    logger.error('getOrCreateUser failed', err, { userId, shortId })
    throw err
  }
}

export const getUserPoints = async (
  userId: string,
  shortId: string,
  nickname?: string,
  ip?: string,
  utmSource?: string,
  referrer?: string | null
): Promise<{ points: bigint; nickname: string | null; shortId: string }> => {
  return getOrCreateUser(
    userId,
    shortId,
    nickname || 'Player',
    ip,
    utmSource,
    referrer
  )
}
