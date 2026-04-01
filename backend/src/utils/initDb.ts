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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      points BIGINT NOT NULL DEFAULT 1000,
      peak_points BIGINT NOT NULL DEFAULT 1000,
      nickname TEXT,
      recovery_code TEXT UNIQUE
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS predictions (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      game_id TEXT NOT NULL,
      pick TEXT NOT NULL,
      bet_amount INTEGER NOT NULL DEFAULT 0,
      result TEXT,
      created_at BIGINT NOT NULL,
      UNIQUE(user_id, game_id)
    )
  `)

  console.log('Database initialized')
}
