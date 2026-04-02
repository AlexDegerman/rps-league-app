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
const POINTS_FLOOR = 1000

const getOrCreateUser = async (userId: string): Promise<number> => {
  const existing = await pool.query(
    `SELECT points FROM users WHERE user_id = $1`,
    [userId]
  )
  if (existing.rows.length > 0) return Number(existing.rows[0].points)

  const recoveryCode = generateRecoveryCode()
  await pool.query(
    `INSERT INTO users (user_id, points, peak_points, recovery_code)
      VALUES ($1, $2, $2, $3)
      ON CONFLICT (user_id) DO NOTHING`,
    [userId, POINTS_FLOOR, recoveryCode]
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
  betAmount: number,
  nickname: string
): Promise<{ success: boolean; error?: string }> => {
  const balance = await getOrCreateUser(userId)
  if (betAmount <= 0)
    return { success: false, error: 'Bet amount must be greater than 0' }
  if (betAmount > balance)
    return { success: false, error: 'Bet amount exceeds balance' }

  // Save/update nickname
  await pool.query(`UPDATE users SET nickname = $1 WHERE user_id = $2`, [
    nickname,
    userId
  ])

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
  winnerName: string,
  broadcast: (event: string, data: string) => void
): Promise<void> => {
  const predictions = await pool.query(
    `SELECT p.*, u.nickname FROM predictions p
      JOIN users u ON p.user_id = u.user_id
      WHERE p.game_id = $1 AND p.result IS NULL`,
    [gameId]
  )

  for (const row of predictions.rows) {
    const result = row.pick === winnerName ? 'WIN' : 'LOSE'

    await pool.query(
      `UPDATE predictions SET result = $1 WHERE user_id = $2 AND game_id = $3`,
      [result, row.user_id, row.game_id]
    )

    const currentPoints = await getUserPoints(row.user_id)
    const bet = Number(row.bet_amount)
    const newPoints =
      result === 'WIN'
        ? currentPoints + bet
        : Math.max(POINTS_FLOOR, currentPoints - Math.floor(bet / 2))

    await pool.query(
      `UPDATE users SET points = $1, peak_points = GREATEST(peak_points, $1) WHERE user_id = $2`,
      [newPoints, row.user_id]
    )

    // Broadcast to all connected clients
    broadcast(
      'prediction_result',
      JSON.stringify({
        userId: row.user_id,
        nickname: row.nickname,
        result,
        amount: result === 'WIN' ? bet : Math.floor(bet / 2),
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

export const getUserStats = async (userId: string) => {
  const result = await pool.query(
    `SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE result = 'WIN') AS wins,
      COUNT(*) FILTER (WHERE result = 'LOSE') AS losses
      FROM predictions
      WHERE user_id = $1 AND result IS NOT NULL`,
    [userId]
  )
  const row = result.rows[0]
  const total = Number(row.total)
  const wins = Number(row.wins)
  const losses = Number(row.losses)
  return {
    total,
    wins,
    losses,
    winRate: total > 0 ? Math.round((wins / total) * 100) : 0
  }
}
export const getGlobalBettingStats = async () => {
  const result = await pool.query(`
    SELECT 
      COUNT(*) as total_bets,
      SUM(bet_amount) as total_volume,
      COUNT(*) FILTER (WHERE result = 'WIN') as winning_bets
    FROM predictions
  `)
  return result.rows[0]
}