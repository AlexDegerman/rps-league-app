import pool from '../utils/db.js'

const POINTS_FLOOR = 500

const getOrCreateUser = async (userId: string): Promise<number> => {
  await pool.query(
    `INSERT INTO users (user_id, points) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING`,
    [userId, POINTS_FLOOR]
  )
  const result = await pool.query(
    `SELECT points FROM users WHERE user_id = $1`,
    [userId]
  )
  return Number(result.rows[0].points)
}

export const getUserPoints = async (userId: string): Promise<number> => {
  return getOrCreateUser(userId)
}

export const savePrediction = async (
  userId: string,
  gameId: string,
  pick: string,
  betAmount: number
): Promise<{ success: boolean; error?: string }> => {
  const balance = await getOrCreateUser(userId)

  if (betAmount <= 0)
    return { success: false, error: 'Bet amount must be greater than 0' }
  if (betAmount > balance)
    return { success: false, error: 'Bet amount exceeds balance' }

  await pool.query(
    `INSERT INTO predictions (user_id, game_id, pick, bet_amount, created_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, game_id) DO NOTHING`,
    [userId, gameId, pick, betAmount, Date.now()]
  )

  return { success: true }
}

export const resolvePrediction = async (
  gameId: string,
  winnerName: string | 'TIE'
): Promise<void> => {
  const predictions = await pool.query(
    `SELECT * FROM predictions WHERE game_id = $1 AND result IS NULL`,
    [gameId]
  )

  for (const row of predictions.rows) {
    const result =
      winnerName === 'TIE' ? 'TIE' : row.pick === winnerName ? 'WIN' : 'LOSE'

    await pool.query(
      `UPDATE predictions SET result = $1 WHERE user_id = $2 AND game_id = $3`,
      [result, row.user_id, row.game_id]
    )

    // Update points based on result
    const currentPoints = await getUserPoints(row.user_id)
    const bet = Number(row.bet_amount)

    let newPoints: number
    if (result === 'WIN') {
      newPoints = currentPoints + bet
    } else if (result === 'LOSE') {
      newPoints = Math.max(POINTS_FLOOR, currentPoints - bet)
    } else {
      // TIE — full refund, no change
      newPoints = currentPoints
    }

    await pool.query(`UPDATE users SET points = $1 WHERE user_id = $2`, [
      newPoints,
      row.user_id
    ])
  }
}

export const getUserPredictions = async (userId: string) => {
  const result = await pool.query(
    `SELECT * FROM predictions WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  )
  return result.rows
}

export const getUserStats = async (userId: string) => {
  const result = await pool.query(
    `SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE result = 'WIN') AS wins,
      COUNT(*) FILTER (WHERE result = 'LOSE') AS losses,
      COUNT(*) FILTER (WHERE result = 'TIE') AS ties
      FROM predictions
      WHERE user_id = $1 AND result IS NOT NULL`,
    [userId]
  )
  const row = result.rows[0]
  const total = Number(row.total)
  const wins = Number(row.wins)
  const losses = Number(row.losses)
  const decidedMatches = wins + losses
  return {
    total,
    wins,
    losses,
    ties: Number(row.ties),
    winRate: decidedMatches > 0 ? Math.round((wins / decidedMatches) * 100) : 0
  }
}
