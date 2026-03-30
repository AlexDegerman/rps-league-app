import pool from '../utils/db.js'

export const savePrediction = async (
  userId: string,
  gameId: string,
  pick: string
): Promise<void> => {
  await pool.query(
    `INSERT INTO predictions (user_id, game_id, pick, created_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, game_id) DO NOTHING`,
    [userId, gameId, pick, Date.now()]
  )
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
