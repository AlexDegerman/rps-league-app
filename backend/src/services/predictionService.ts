import pool from '../utils/db.js'
import { getOrCreateUser } from './userService.js';

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
}

// 40% chance of a bonus. Tier determines the multiplier range applied on top of the base payout.
const rollBonus = (
  isWin: boolean,
  pityCount: number,
  currentPoints: bigint
): { multiplier: number; tier: string } | null => {
  const forceBonus = pityCount >= 3

  // STARTER BOOST: 80% for players < 2M, 40% for everyone else
  const bonusChance = currentPoints < 2000000n ? 0.8 : 0.4
  if (!forceBonus && Math.random() > bonusChance) return null

  const roll = Math.random() * 100

  // 0 - 60 (60% chance)
  if (roll < 60) {
    // COMMON: Win 100-200% bonus | Loss 20-40% reduction
    return {
      multiplier: isWin ? 1.0 + Math.random() * 1.0 : 0.2 + Math.random() * 0.2,
      tier: 'COMMON'
    }
  }

  // 60 - 85 (25% chance)
  if (roll < 85) {
    // RARE: Win 201-349% bonus | Loss 41-70% reduction
    return {
      multiplier: isWin
        ? 2.01 + Math.random() * 1.48
        : 0.41 + Math.random() * 0.29,
      tier: 'RARE'
    }
  }

  // 85 - 98 (13% chance)
  if (roll < 98) {
    // EPIC: Win 350-499% bonus | Loss 71-99% reduction
    return {
      multiplier: isWin
        ? 3.5 + Math.random() * 1.49
        : 0.71 + Math.random() * 0.28,
      tier: 'EPIC'
    }
  }

  // 98 - 100 (2% chance -> 1/50)
  // LEGENDARY: 100% Loss protection (1.0) or 1000% Win Bonus (10.0)
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
  // JOIN fetches balance and bet count in one query to avoid N+1 calls per bettor
  const predictions = await pool.query(
    `SELECT
      p.*,
      u.nickname,
      u.points AS current_points,
      u.bonus_pity_count,
      (SELECT COUNT(*) FROM predictions WHERE user_id = p.user_id) AS total_bets
      FROM predictions p
      JOIN users u ON p.user_id = u.user_id
      WHERE p.game_id = $1 AND p.result IS NULL`,
    [gameId]
  )

  for (const row of predictions.rows) {
    const result = row.pick === winnerName ? 'WIN' : 'LOSE'
    const isWin = result === 'WIN'
    const currentPoints = BigInt(row.current_points)
    const bet = BigInt(row.bet_amount)
    const totalBets = Number(row.total_bets)
    const currentPity = Number(row.bonus_pity_count)

    const isNaturalPityHit = currentPity >= 3

    const bonus = rollBonus(
      isWin,
      totalBets <= 3 ? 3 : currentPity,
      currentPoints
    )

    const effectiveMult = bonus
      ? BigInt(Math.floor(bonus.multiplier * 100))
      : 0n

    const baseChange = isWin ? bet : bet / 2n
    const bonusAmount = (baseChange * effectiveMult) / 100n

    let gainLoss: bigint

    if (isWin) {
      gainLoss = baseChange + bonusAmount
    } else {
      const actualLoss = baseChange - bonusAmount
      const provisionalPoints = currentPoints - actualLoss
      gainLoss =
        provisionalPoints < POINTS_FLOOR
          ? POINTS_FLOOR - currentPoints
          : -actualLoss
    }

    await pool.query(
      `UPDATE predictions SET result = $1, gain_loss = $2 WHERE user_id = $3 AND game_id = $4`,
      [result, gainLoss.toString(), row.user_id, row.game_id]
    )

    // Single UPDATE keeps all peak columns in sync atomically
    await pool.query(
      `UPDATE users
        SET points             = points + $1,
            peak_points        = GREATEST(peak_points, points + $1),
            daily_peak         = GREATEST(daily_peak,  points + $1),
            weekly_peak        = GREATEST(weekly_peak, points + $1),
            bonus_pity_count   = $3,
            total_volume       = total_volume + $4,
            biggest_win        = CASE WHEN $5 = 'WIN' THEN GREATEST(biggest_win, $1) ELSE biggest_win END,
            current_win_streak = CASE WHEN $5 = 'WIN' THEN current_win_streak + 1 ELSE 0 END,
            max_win_streak     = CASE 
                                    WHEN $5 = 'WIN' AND (current_win_streak + 1) > max_win_streak 
                                    THEN current_win_streak + 1 
                                    ELSE max_win_streak 
                                  END,
            total_pities_earned = total_pities_earned + $6
        WHERE user_id = $2`,
      [
        gainLoss.toString(),
        row.user_id,
        bonus ? 0 : currentPity + 1,
        bet.toString(),
        result,
        isNaturalPityHit ? 1 : 0
      ]
    )

    broadcast(
      'prediction_result',
      JSON.stringify({
        userId: row.user_id,
        nickname: row.nickname,
        result,
        gameId,
        amount: baseChange.toString(),
        bonus: bonus
          ? {
              amount: bonusAmount.toString(),
              tier: bonus.tier,
              visualMultiplier: Number(effectiveMult)
            }
          : null,
        wasAllIn: bet === currentPoints
      })
    )
  }
}

export const getUserPredictions = async (userId: string) => {
  const result = await pool.query(
    `SELECT * FROM predictions WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  )
  return result.rows
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
