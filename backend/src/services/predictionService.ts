import pool from '../utils/db.js'
import { getOrCreateUser } from './userService.js'
import {
  getFlashEventForUser,
  consumeFlashBetForUser,
  tryTriggerFlashEventForUser
} from './flashEventService.js'
import { logger } from '../utils/logger.js'

const POINTS_FLOOR = 100000n

export const savePrediction = async (
  userId: string,
  gameId: string,
  pick: string,
  betAmount: bigint,
  nickname: string,
  shortId: string
): Promise<{ success: boolean; error?: string }> => {
  const { points: balance } = await getOrCreateUser(userId, shortId)

  if (betAmount <= 0n)
    return { success: false, error: 'Bet amount must be greater than 0' }
  if (betAmount > balance)
    return { success: false, error: 'Bet amount exceeds balance' }

  try {
    const nameCheck = await pool.query(
      `SELECT user_id FROM users WHERE nickname = $1 AND user_id != $2`,
      [nickname, userId]
    )

    if (nameCheck.rows.length > 0) {
      return { success: false, error: 'NICKNAME ALREADY TAKEN' }
    }

    const matchRes = await pool.query(
      `SELECT expires_at FROM matches WHERE game_id = $1`,
      [gameId]
    )
    if (matchRes.rows.length === 0)
      return { success: false, error: 'MATCH NOT FOUND' }
    if (Date.now() > Number(matchRes.rows[0].expires_at))
      return { success: false, error: 'BETTING WINDOW CLOSED' }

    await pool.query(`UPDATE users SET nickname = $1 WHERE user_id = $2`, [
      nickname,
      userId
    ])

    const insertResult = await pool.query(
      `INSERT INTO predictions (user_id, game_id, pick, bet_amount, created_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, game_id) DO NOTHING`,
      [userId, gameId, pick, betAmount.toString(), Date.now()]
    )

    if (insertResult.rowCount === 0)
      return { success: false, error: 'BET ALREADY PLACED' }

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

// 40% chance of a bonus. Tier determines the multiplier range applied to the win amount.
const rollBonus = (
  isWin: boolean,
  pityCount: number,
  currentPoints: bigint,
  flashType?: string | null
): { multiplier: number; tier: string } | null => {
  if (flashType === 'CARDS' && isWin) {
    return { multiplier: 10.0, tier: 'LEGENDARY' }
  }

  const forceBonus = pityCount >= 3
  const bonusChance = currentPoints < 2000000n ? 0.8 : 0.4
  if (!forceBonus && Math.random() > bonusChance) return null

  const roll = Math.random() * 100

  // 0 - 59.5 (59.5% chance)
  if (roll < 59.5) {
    // COMMON: Win 2.0–3.0× | Loss keep 60–80% (lose 20–40%)
    return {
      multiplier: isWin ? 2.0 + Math.random() * 1.0 : 0.6 + Math.random() * 0.2,
      tier: 'COMMON'
    }
  }

  // 59.5 - 84.5 (25% chance)
  if (roll < 84.5) {
    // RARE: Win 3.0–5.0× | Loss keep 30–59% (lose 41–70%)
    return {
      multiplier: isWin
        ? 3.0 + Math.random() * 2.0
        : 0.3 + Math.random() * 0.29,
      tier: 'RARE'
    }
  }

  // 84.5 - 97.5 (13% chance)
  if (roll < 97.5) {
    // EPIC: Win 5.0–8.0× | Loss keep 1–29% (lose 71–99%)
    return {
      multiplier: isWin
        ? 5.0 + Math.random() * 3.0
        : 0.01 + Math.random() * 0.28,
      tier: 'EPIC'
    }
  }

  // 97.5 - 100 (2.5% chance)
  // LEGENDARY: Win 10.0× | Loss full protection (keep 100%)
  return {
    multiplier: isWin ? 10.0 : 1.0,
    tier: 'LEGENDARY'
  }
}

export const resolvePrediction = async (
  gameId: string,
  winnerName: string,
  broadcast: (event: string, data: string) => void
): Promise<void> => {
  let predictions
  try {
    // JOIN fetches balance and bet count in one query to avoid N+1 calls per bettor
    predictions = await pool.query(
      `SELECT
        p.*,
        u.nickname,
        u.points AS current_points,
        u.bonus_pity_count,
        u.current_win_streak,
        (SELECT COUNT(*) FROM predictions WHERE user_id = p.user_id) AS total_bets
        FROM predictions p
        JOIN users u ON p.user_id = u.user_id
        WHERE p.game_id = $1 AND p.result IS NULL`,
      [gameId]
    )
  } catch (err) {
    logger.error('resolvePrediction: failed to fetch predictions', err, {
      gameId
    })
    return
  }

  for (const row of predictions.rows) {
    try {
      const flashEvent = getFlashEventForUser(row.user_id)
      const flashEventType = flashEvent?.type ?? null

      const flashActive = !!flashEvent
      const result = flashActive
        ? 'WIN'
        : row.pick === winnerName
          ? 'WIN'
          : 'LOSE'
      const isWin = result === 'WIN'

      const currentPoints = BigInt(row.current_points)
      const bet = BigInt(row.bet_amount)
      const totalBets = Number(row.total_bets)
      const currentPity = Number(row.bonus_pity_count)

      const isNaturalPityHit = currentPity >= 3

      const bonus = rollBonus(
        isWin,
        totalBets <= 3 ? 3 : currentPity,
        currentPoints,
        flashEventType
      )

      const effectiveMult = bonus
        ? BigInt(Math.floor(bonus.multiplier * 100))
        : 0n

      const baseChange = isWin ? bet : bet / 2n

      let gainLoss: bigint

      if (isWin) {
        gainLoss = bonus ? (baseChange * effectiveMult) / 100n : baseChange
      } else {
        const actualLoss = bonus
          ? (baseChange * effectiveMult) / 100n
          : baseChange
        const provisionalPoints = currentPoints - actualLoss
        gainLoss =
          provisionalPoints < POINTS_FLOOR
            ? POINTS_FLOOR - currentPoints
            : -actualLoss
      }

      const bonusDisplayAmount = bonus
        ? isWin
          ? gainLoss - baseChange
          : baseChange - -gainLoss
        : 0n

      const streakAfter = isWin ? Number(row.current_win_streak) + 1 : 0
      const streakMult =
        streakAfter >= 5
          ? 10n
          : streakAfter >= 4
            ? 6n
            : streakAfter >= 3
              ? 3n
              : 1n

      if (isWin && streakMult > 1n) {
        gainLoss = gainLoss * streakMult
      }

      const flashMult = isWin && flashEvent ? flashEvent.multiplier : 1

      if (isWin && flashEvent) {
        const effectiveFlashMult = BigInt(Math.floor(flashMult * 100))
        gainLoss = (gainLoss * effectiveFlashMult) / 100n
        consumeFlashBetForUser(row.user_id)
      }

      await pool.query(
        `UPDATE predictions 
          SET result = $1, 
            gain_loss = $2,
            bonus_tier = $3,
            bonus_multiplier = $4,
            flash_event_type = $7,
            flash_multiplier = $8
          WHERE user_id = $5 AND game_id = $6`,
        [
          result,
          gainLoss.toString(),
          bonus ? bonus.tier : null,
          bonus ? Number(effectiveMult) : 0,
          row.user_id,
          row.game_id,
          flashEventType,
          flashMult
        ]
      )

      await pool.query(
        `UPDATE users
      SET points               = points + $1,
          peak_points          = GREATEST(peak_points, points + $1),
          daily_peak           = GREATEST(daily_peak,  points + $1),
          weekly_peak          = GREATEST(weekly_peak, points + $1),
          bonus_pity_count     = $3,
          total_volume         = total_volume + $4,
          biggest_win          = CASE WHEN $5 = 'WIN' THEN GREATEST(biggest_win, $1) ELSE biggest_win END,
          biggest_single_win   = CASE WHEN $5 = 'WIN' THEN GREATEST(biggest_single_win, $1) ELSE biggest_single_win END,
          current_win_streak   = CASE WHEN $5 = 'WIN' THEN current_win_streak + 1 ELSE 0 END,
          max_win_streak       = CASE 
                                    WHEN $5 = 'WIN' AND (current_win_streak + 1) > max_win_streak 
                                    THEN current_win_streak + 1 
                                    ELSE max_win_streak 
                                  END,
          total_pities_earned  = total_pities_earned + $6,
          total_flash_events_caught = CASE WHEN $7::text IS NOT NULL AND $5 = 'WIN' THEN total_flash_events_caught + 1 ELSE total_flash_events_caught END
      WHERE user_id = $2`,
        [
          gainLoss.toString(),
          row.user_id,
          bonus ? 0 : currentPity + 1,
          bet.toString(),
          result,
          isNaturalPityHit ? 1 : 0,
          flashEventType
        ]
      )

      broadcast(
        'prediction_result',
        JSON.stringify({
          userId: row.user_id,
          nickname: row.nickname,
          result,
          gameId,
          amount: gainLoss > 0n ? gainLoss.toString() : (-gainLoss).toString(),
          bonus: bonus
            ? {
                amount:
                  bonusDisplayAmount > 0n ? bonusDisplayAmount.toString() : '0',
                tier: bonus.tier,
                visualMultiplier: Number(effectiveMult)
              }
            : null,
          wasAllIn: bet === currentPoints,
          streakAfter,
          streakMult: Number(streakMult),
          flashEventType,
          flashMult
        })
      )
      tryTriggerFlashEventForUser(row.user_id, broadcast)
    } catch (err) {
      logger.errorWithPoints('resolvePrediction: failed for user', err, {
        userId: row.user_id,
        gameId,
        points: BigInt(row.current_points),
        betAmount: BigInt(row.bet_amount)
      })
      // continue loop - one user failing shouldn't block others
    }
  }
}

export const getPaginatedUserPredictions = async (
  userId: string,
  page: number,
  limit: number,
  sort: 'recent' | 'wins' | 'multipliers' = 'recent'
) => {
  const offset = (page - 1) * limit

  // Build separate queries per sort mode to avoid dynamic SQL injection issues
  let dataQuery: string
  let countQuery: string
  const baseParams = [userId, limit, offset]
  const countParams = [userId]

  if (sort === 'wins') {
    dataQuery = `
      SELECT 
        p.id,
        p.game_id          AS "gameId",
        p.pick,
        p.bet_amount       AS "betAmount",
        p.gain_loss        AS "gainLoss",
        p.result,
        p.bonus_tier       AS "bonusTier",
        p.bonus_multiplier AS "bonusMultiplier",
        p.flash_event_type AS "flashEventType",
        p.flash_multiplier AS "flashMult",
        p.created_at       AS "createdAt",
        m.player_a_name,
        m.player_a_played,
        m.player_b_name,
        m.player_b_played,
        m.time,
        m.type
      FROM predictions p
      LEFT JOIN matches m ON p.game_id = m.game_id
      WHERE p.user_id = $1 AND p.result = 'WIN'
      ORDER BY p.gain_loss DESC
      LIMIT $2 OFFSET $3`
    countQuery = `SELECT COUNT(*) FROM predictions WHERE user_id = $1 AND result = 'WIN'`
  } else if (sort === 'multipliers') {
    dataQuery = `
      SELECT 
        p.id,
        p.game_id          AS "gameId",
        p.pick,
        p.bet_amount       AS "betAmount",
        p.gain_loss        AS "gainLoss",
        p.result,
        p.bonus_tier       AS "bonusTier",
        p.bonus_multiplier AS "bonusMultiplier",
        p.flash_event_type AS "flashEventType",
        p.flash_multiplier AS "flashMult",
        p.created_at       AS "createdAt",
        m.player_a_name,
        m.player_a_played,
        m.player_b_name,
        m.player_b_played,
        m.time,
        m.type
      FROM predictions p
      LEFT JOIN matches m ON p.game_id = m.game_id
      WHERE p.user_id = $1 AND p.result = 'WIN' AND (p.bonus_multiplier > 0 OR p.flash_multiplier > 1)
      ORDER BY (p.bonus_multiplier * GREATEST(p.flash_multiplier, 1)) DESC
      LIMIT $2 OFFSET $3`
    countQuery = `SELECT COUNT(*) FROM predictions WHERE user_id = $1 AND result = 'WIN' AND (bonus_multiplier > 0 OR flash_multiplier > 1)`
  } else {
    dataQuery = `
      SELECT 
        p.id,
        p.game_id          AS "gameId",
        p.pick,
        p.bet_amount       AS "betAmount",
        p.gain_loss        AS "gainLoss",
        p.result,
        p.bonus_tier       AS "bonusTier",
        p.bonus_multiplier AS "bonusMultiplier",
        p.flash_event_type AS "flashEventType",
        p.flash_multiplier AS "flashMult",
        p.created_at       AS "createdAt",
        m.player_a_name,
        m.player_a_played,
        m.player_b_name,
        m.player_b_played,
        m.time,
        m.type
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
    createdAt: Number(row.createdAt)
  }))

  return { matches, predictions, total, hasMore: offset + limit < total }
}

export const getUserStats = async (userId: string, shortId: string) => {
  // Ensure the user exists and has their shortId synced before fetching stats
  // This handles the "creation" side using the new 2-argument signature
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
        u.current_win_streak,
        u.total_pities_earned,
        u.joined_date,
        COALESCE(p_stats.total, 0) as total,
        COALESCE(p_stats.wins, 0) as wins,
        COALESCE(p_stats.losses, 0) as losses,
        COALESCE(p_stats.total_gain, 0) as total_gain
      FROM users u
      LEFT JOIN (
        SELECT 
            user_id,
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE result = 'WIN') AS wins,
            COUNT(*) FILTER (WHERE result = 'LOSE') AS losses,
            SUM(gain_loss) FILTER (WHERE gain_loss > 0) AS total_gain
        FROM predictions
        WHERE result IS NOT NULL
        GROUP BY user_id
      ) p_stats ON u.user_id = p_stats.user_id
      WHERE u.user_id = $1`,
    [userId]
  )

  const row = result.rows[0]

  // Fallback if the query somehow fails after creation
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

  const total = Number(row.total)
  const wins = Number(row.wins)
  const totalGain = row.total_gain.toString()

  return {
    total,
    wins,
    losses: Number(row.losses),
    winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
    totalGain: totalGain,
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
