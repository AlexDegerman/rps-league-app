import pool from '../utils/db.js'

const wordList = [
  'swift',
  'bold',
  'calm',
  'fierce',
  'brave',
  'clever',
  'mighty',
  'nimble',
  'silent',
  'loyal',
  'wild',
  'sharp',
  'bright',
  'sly',
  'wise',
  'agile',
  'steady',
  'noble',
  'quick',
  'keen',
  'proud',
  'royal',
  'tough',
  'vivid',
  'tiger',
  'falcon',
  'wolf',
  'eagle',
  'fox',
  'bear',
  'hawk',
  'lynx',
  'raven',
  'cobra',
  'panda',
  'crane',
  'viper',
  'bison',
  'moose',
  'otter'
]

export const generateRecoveryCode = (): string => {
  const rand = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]!
  const num = Math.floor(Math.random() * 9000 + 1000)
  return `${rand(wordList)}-${rand(wordList)}-${num}`
}
const POINTS_FLOOR = 100000n

const getOrCreateUser = async (userId: string): Promise<bigint> => {
  const existing = await pool.query(
    `SELECT points FROM users WHERE user_id = $1`,
    [userId]
  )
  if (existing.rows.length > 0) return BigInt(existing.rows[0].points)

  const recoveryCode = generateRecoveryCode()
  await pool.query(
    `INSERT INTO users (user_id, points, peak_points, recovery_code)
      VALUES ($1, $2, $2, $3)
      ON CONFLICT (user_id) DO NOTHING`,
    [userId, POINTS_FLOOR.toString(), recoveryCode]
  )
  const result = await pool.query(
    `SELECT points FROM users WHERE user_id = $1`,
    [userId]
  )
  return BigInt(result.rows[0].points)
}

export const getUserPoints = async (userId: string): Promise<bigint> => {
  return getOrCreateUser(userId)
}

export const savePrediction = async (
  userId: string,
  gameId: string,
  pick: string,
  betAmount: bigint,
  nickname: string
): Promise<{ success: boolean; error?: string }> => {
  const balance = await getOrCreateUser(userId)
  if (betAmount <= 0n)
    return { success: false, error: 'Bet amount must be greater than 0' }
  if (betAmount > balance)
    return { success: false, error: 'Bet amount exceeds balance' }
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

  if (insertResult.rowCount === 0) {
    return { success: false, error: 'BET ALREADY PLACED' }
  }

  return { success: true }
}

const rollBonus = (): { multiplier: number; tier: string } | null => {
  // 25% chance of any bonus
  if (Math.random() > .25) return null

  const roll = Math.random() * 100
  if (roll < 50) {
    // Common: 20–40%
    const multiplier = 0.2 + Math.random() * 0.2
    return { multiplier, tier: 'COMMON' }
  } else if (roll < 80) {
    // Rare: 41–70%
    const multiplier = 0.41 + Math.random() * 0.29
    return { multiplier, tier: 'RARE' }
  } else if (roll < 90) {
    // Epic: 71–99%
    const multiplier = 0.71 + Math.random() * 0.28
    return { multiplier, tier: 'EPIC' }
  } else {
    // Legendary: 100%
    return { multiplier: 1.0, tier: 'LEGENDARY' }
  }
}

export const resolvePrediction = async (
  gameId: string,
  winnerName: string,
  broadcast: (event: string, data: string) => void
): Promise<void> => {
  const predictions = await pool.query(
    `SELECT 
      p.*, 
      u.nickname, 
      u.points as current_points,
      (SELECT COUNT(*) FROM predictions WHERE user_id = p.user_id) as total_bets
    FROM predictions p
    JOIN users u ON p.user_id = u.user_id
    WHERE p.game_id = $1 AND p.result IS NULL`,
    [gameId]
  )

  for (const row of predictions.rows) {
    const result = row.pick === winnerName ? 'WIN' : 'LOSE'
    const currentPoints = BigInt(row.current_points)
    const bet = BigInt(row.bet_amount)
    const totalBets = Number(row.total_bets)
    const BIG_POINTS_FLOOR = 100000n

    const bonus =
    totalBets <= 3 ? { multiplier: 0.25, tier: 'COMMON' } : rollBonus()

    const multiplierPct = bonus
      ? BigInt(Math.floor(bonus.multiplier * 100))
      : 0n

    const SHIELD_WEIGHT = 50n
    const effectiveMult =
      result === 'WIN' ? multiplierPct : (multiplierPct * SHIELD_WEIGHT) / 100n

    const bonusAmount = (bet * effectiveMult) / 100n
    const baseChange = result === 'WIN' ? bet : bet / 2n

    let gainLoss: bigint

    if (result === 'WIN') {
      gainLoss = baseChange + bonusAmount
    } else {
      const actualLoss = baseChange - bonusAmount
      const provisionalPoints = currentPoints - actualLoss

      if (provisionalPoints < BIG_POINTS_FLOOR) {
        gainLoss = BIG_POINTS_FLOOR - currentPoints
      } else {
        gainLoss = -actualLoss
      }
    }
    
    await pool.query(
      `UPDATE predictions 
        SET result = $1, gain_loss = $2 
        WHERE user_id = $3 AND game_id = $4`,
      [result, gainLoss.toString(), row.user_id, row.game_id]
    )

    await pool.query(
      `UPDATE users 
        SET points = points + $1,
          peak_points = GREATEST(peak_points, points + $1),
          daily_peak = GREATEST(daily_peak, points + $1),
          weekly_peak = GREATEST(weekly_peak, points + $1)
        WHERE user_id = $2`,
      [gainLoss.toString(), row.user_id]
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
              tier: bonus.tier
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

// Inside your service exports
export const getUserStats = async (userId: string) => {
  const result = await pool.query(
    `SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE result = 'WIN') AS wins,
      COUNT(*) FILTER (WHERE result = 'LOSE') AS losses,
      COALESCE(SUM(gain_loss), 0) AS total_gain,
      (SELECT points FROM users WHERE user_id = $1) as points,
      (SELECT peak_points FROM users WHERE user_id = $1) as peak_points
      FROM predictions
      WHERE user_id = $1 AND result IS NOT NULL`,
    [userId]
  )

  const row = result.rows[0]
  if (!row) {
    return {
      total: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      total_gain: '0',
      points: '100000',
      peak_points: '100000'
    }
  }

  const total = Number(row.total)
  const wins = Number(row.wins)

  return {
    total,
    wins,
    losses: Number(row.losses),
    winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
    total_gain: row.total_gain,
    points: row.points,
    peak_points: row.peak_points
  }
}

export const getGlobalBettingStats = async () => {
  const result = await pool.query(`
    SELECT 
      COUNT(*) as total_bets,
      COALESCE(SUM(bet_amount), 0) as total_volume,
      COUNT(*) FILTER (WHERE result = 'WIN') as winning_bets
    FROM predictions
  `)
  const row = result.rows[0]
  return {
    total_bets: Number(row.total_bets),
    total_volume: row.total_volume.toString(),
    winning_bets: Number(row.winning_bets)
  }
}