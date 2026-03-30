import pool from './db.js'

export const initDb = async (): Promise<void> => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS matches (
      game_id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      time BIGINT NOT NULL,
      player_a_name TEXT NOT NULL,
      player_a_played TEXT NOT NULL,
      player_b_name TEXT NOT NULL,
      player_b_played TEXT NOT NULL
    )
  `)
  console.log('Database initialized')
}
