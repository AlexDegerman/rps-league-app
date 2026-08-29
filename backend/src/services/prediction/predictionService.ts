import pool from '../../utils/db.js'
import { getOrCreateUser } from '../userService.js'
import { hasUserUsedOracle, getOracleState } from '../oracleProphecyService.js'
import { recordInteraction } from '../sessionService.js'
import { isWorldBossActive } from '../worldBossService.js'
import { logger } from '../../utils/logger.js'
import {
  fetchPendingPredictions,
  resolveUserPrediction
} from './predictionResolver.js'
import { resolveWorldBossPrediction } from './predictionWorldBoss.js'

export const savePrediction = async (
  userId: string,
  gameId: string,
  pick: string,
  betAmount: bigint,
  nickname: string,
  shortId: string
): Promise<{ success: boolean; error?: string }> => {
  const { points: balance } = await getOrCreateUser(userId, shortId)

  if (betAmount <= 0n) return { success: false, error: 'Invalid bet amount' }
  if (betAmount > balance)
    return { success: false, error: 'Bet could not be processed' }

  try {
    const nameCheck = await pool.query(
      `SELECT user_id FROM users WHERE nickname = $1 AND user_id != $2`,
      [nickname, userId]
    )

    if (nameCheck.rows.length > 0) {
      return { success: false, error: 'Nickname unavailable' }
    }

    const matchRes = await pool.query(
      `SELECT expires_at, player_a_name, player_b_name FROM matches WHERE game_id = $1`,
      [gameId]
    )
    if (matchRes.rows.length === 0)
      return { success: false, error: 'Invalid match' }
    const GRACE_MS = 400
    if (Date.now() > Number(matchRes.rows[0].expires_at) + GRACE_MS)
      return { success: false, error: 'Selection window closed' }

    const oracleUsed = await hasUserUsedOracle(userId)
    let betAgainstOracle = false
    if (!oracleUsed) {
      const oracleState = getOracleState()
      const oracleWinnerName =
        oracleState.side === 'left'
          ? matchRes.rows[0].player_a_name
          : matchRes.rows[0].player_b_name
      betAgainstOracle = pick !== oracleWinnerName
    }

    await pool.query(`UPDATE users SET nickname = $1 WHERE user_id = $2`, [
      nickname,
      userId
    ])

    const insertResult = await pool.query(
      `INSERT INTO predictions (user_id, game_id, pick, bet_amount, created_at, bet_against_oracle)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id, game_id) DO NOTHING`,
      [userId, gameId, pick, betAmount.toString(), Date.now(), betAgainstOracle]
    )

    if (insertResult.rowCount === 0)
      return { success: false, error: 'BET ALREADY PLACED' }

    recordInteraction(userId, 'prediction').catch(() => {})

    return { success: true }
  } catch (err) {
    logger.errorWithPoints('savePrediction failed', err, {
      userId,
      gameId,
      points: balance,
      betAmount
    })
    return { success: false, error: 'Internal error' }
  }
}

export const resolvePrediction = async (
  gameId: string,
  winnerName: string,
  broadcast: (event: string, data: string) => void,
  isAutobet = false
): Promise<void> => {
  if (isWorldBossActive()) {
    return resolveWorldBossPrediction(gameId, winnerName, broadcast)
  }

  let rows
  try {
    rows = await fetchPendingPredictions(gameId)
  } catch (err) {
    logger.error('resolvePrediction: failed to fetch predictions', err, {
      gameId
    })
    return
  }

  // Resolve bettors concurrently and independently so one transaction failure does not affect other bettors
  await Promise.all(
    rows.map(async (row) => {
      try {
        await resolveUserPrediction(
          row,
          gameId,
          winnerName,
          isAutobet,
          broadcast
        )
      } catch (err) {
        logger.errorWithPoints('resolvePrediction: failed for user', err, {
          userId: row.user_id,
          gameId,
          points: BigInt(row.current_points),
          betAmount: BigInt(row.bet_amount)
        })
      }
    })
  )
}

export const getPaginatedUserPredictions = async (
  userId: string,
  page: number,
  limit: number,
  sort: 'recent' | 'wins' | 'multipliers' = 'recent'
) => {
  const offset = (page - 1) * limit
  let dataQuery: string
  let countQuery: string
  const baseParams = [userId, limit, offset]
  const countParams = [userId]

  const pCols = `
    p.id, p.game_id AS "gameId", p.pick, p.bet_amount AS "betAmount",
    p.gain_loss AS "gainLoss", p.result, p.bonus_tier AS "bonusTier",
    p.bonus_multiplier AS "bonusMultiplier", p.flash_event_type AS "flashEventType",
    p.flash_multiplier AS "flashMult", p.streak_multiplier AS "streakMultiplier",
    p.created_at AS "createdAt", p.relic_multiplier AS "relicMultiplier",
    p.total_multiplier AS "totalMultiplier",
    p.festival_multiplier AS "festivalMultiplier",
    p.festival_type AS "festivalType",
    p.global_event_type AS "globalEventType",
    p.global_echo_amount AS "globalEchoAmount"`

  if (sort === 'wins') {
    dataQuery = `
      SELECT ${pCols}, m.player_a_name, m.player_a_played, m.player_b_name, m.player_b_played, m.time, m.type
      FROM predictions p
      LEFT JOIN matches m ON p.game_id = m.game_id
      WHERE p.user_id = $1 AND p.result = 'WIN'
      ORDER BY p.gain_loss DESC
      LIMIT $2 OFFSET $3`
    countQuery = `SELECT COUNT(*) FROM predictions WHERE user_id = $1 AND result = 'WIN'`
  } else if (sort === 'multipliers') {
    dataQuery = `
      SELECT ${pCols}, m.player_a_name, m.player_a_played, m.player_b_name, m.player_b_played, m.time, m.type
      FROM predictions p
      LEFT JOIN matches m ON p.game_id = m.game_id
      WHERE p.user_id = $1 AND p.result = 'WIN' AND (p.bonus_multiplier > 0 OR p.flash_multiplier > 1 OR p.festival_multiplier > 1)
      ORDER BY p.total_multiplier DESC
      LIMIT $2 OFFSET $3`
    countQuery = `SELECT COUNT(*) FROM predictions WHERE user_id = $1 AND result = 'WIN' AND (bonus_multiplier > 0 OR flash_multiplier > 1 OR festival_multiplier > 1)`
  } else {
    dataQuery = `
      SELECT ${pCols}, m.player_a_name, m.player_a_played, m.player_b_name, m.player_b_played, m.time, m.type
      FROM predictions p
      LEFT JOIN matches m ON p.game_id = m.game_id
      WHERE p.user_id = $1 AND p.result IS NOT NULL
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3`
    countQuery = `SELECT COUNT(*) FROM predictions WHERE user_id = $1 AND result IS NOT NULL`
  }

  const [data, count] = await Promise.all([
    pool.query(dataQuery, baseParams),
    pool.query(countQuery, countParams)
  ])

  const total = Number(count.rows[0].count)

  const matches = data.rows.map((row) => ({
    gameId: row.gameId,
    time: Number(row.time),
    type: row.type || 'GAME_RESULT',
    playerA: {
      name: row.player_a_name || 'Unknown',
      played: row.player_a_played || 'ROCK'
    },
    playerB: {
      name: row.player_b_name || 'Unknown',
      played: row.player_b_played || 'SCISSORS'
    }
  }))

  const predictions = data.rows.map((row) => ({
    id: row.id,
    gameId: row.gameId,
    pick: row.pick,
    betAmount: row.betAmount?.toString() ?? '0',
    gainLoss: row.gainLoss?.toString() ?? '0',
    result: row.result,
    bonusTier: row.bonusTier ?? null,
    bonusMultiplier: Number(row.bonusMultiplier ?? 0),
    flashEventType: row.flashEventType ?? null,
    flashMult: Number(row.flashMult ?? 1),
    streakMultiplier: Number(row.streakMultiplier ?? 1),
    createdAt: Number(row.createdAt),
    relicMultiplier: Number(row.relicMultiplier ?? 1),
    totalMultiplier: Number(row.totalMultiplier || row.total_multiplier || 1),
    festivalMultiplier: Number(row.festivalMultiplier || 1),
    festivalType: row.festivalType || null,
    globalEventType: row.globalEventType ?? null,
    globalEchoAmount: row.globalEchoAmount
      ? row.globalEchoAmount.toString()
      : null
  }))

  return { matches, predictions, total, hasMore: offset + limit < total }
}

export const getUserStats = async (userId: string, shortId: string) => {
  await getOrCreateUser(userId, shortId)

  const result = await pool.query(
    `SELECT
        u.points,
        u.peak_points,
        u.daily_peak,
        u.weekly_peak,
        u.total_volume,
        u.biggest_win,
        u.current_win_streak,
        u.max_win_streak,
        u.bonus_pity_count,
        u.total_pities_earned,
        u.joined_date,
        u.wins,
        u.losses,
        COALESCE(p_stats.total_gain, 0) as total_gain
      FROM users u
      LEFT JOIN (
        SELECT
            user_id,
            SUM(gain_loss) FILTER (WHERE gain_loss > 0) AS total_gain
        FROM predictions
        WHERE result IS NOT NULL
        GROUP BY user_id
      ) p_stats ON u.user_id = p_stats.user_id
      WHERE u.user_id = $1`,
    [userId]
  )

  const row = result.rows[0]

  if (!row) {
    return {
      total: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      totalGain: '0',
      points: '200000',
      peakPoints: '200000',
      dailyPeak: '100000',
      weeklyPeak: '100000',
      totalVolume: '0',
      biggestWin: '0',
      currentWinStreak: 0,
      maxWinStreak: 0,
      bonusPityCount: 0,
      totalPitiesEarned: 0,
      joinedDate: Date.now().toString(),
      avgReturn: '0'
    }
  }

  const wins = Number(row.wins || 0)
  const losses = Number(row.losses || 0)
  const total = wins + losses
  const totalGain = row.total_gain.toString()

  return {
    total,
    wins,
    losses,
    winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
    totalGain,
    points: row.points.toString(),
    peakPoints: row.peak_points.toString(),
    dailyPeak: row.daily_peak.toString(),
    weeklyPeak: row.weekly_peak.toString(),
    totalVolume: row.total_volume.toString(),
    biggestWin: row.biggest_win.toString(),
    currentWinStreak: Number(row.current_win_streak),
    maxWinStreak: Number(row.max_win_streak),
    bonusPityCount: Number(row.bonus_pity_count),
    totalPitiesEarned: Number(row.total_pities_earned || 0),
    joinedDate: row.joined_date.toString(),
    avgReturn: total > 0 ? (BigInt(totalGain) / BigInt(total)).toString() : '0'
  }
}

export const getGlobalBettingStats = async () => {
  const result = await pool.query(
    `SELECT
        COUNT(*) AS total_bets,
        COALESCE(SUM(bet_amount), 0) AS total_volume,
        COUNT(*) FILTER (WHERE result = 'WIN') AS winning_bets
      FROM predictions`
  )
  const row = result.rows[0]
  return {
    total_bets: Number(row.total_bets),
    total_volume: row.total_volume.toString(),
    winning_bets: Number(row.winning_bets)
  }
}
