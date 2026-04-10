import pool from './db.js'

export const initDb = async (): Promise<void> => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS matches (
      game_id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      time BIGINT NOT NULL,
      expires_at BIGINT,
      player_a_name TEXT NOT NULL,
      player_a_played TEXT NOT NULL,
      player_b_name TEXT NOT NULL,
      player_b_played TEXT NOT NULL
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      short_id TEXT UNIQUE,
      points NUMERIC NOT NULL DEFAULT 200000,
      peak_points NUMERIC NOT NULL DEFAULT 200000,
      daily_peak NUMERIC DEFAULT 100000,
      weekly_peak NUMERIC DEFAULT 100000,
      nickname TEXT,
      recovery_code TEXT UNIQUE,
      total_volume NUMERIC NOT NULL DEFAULT 0,
      biggest_win NUMERIC NOT NULL DEFAULT 0,
      current_win_streak INTEGER NOT NULL DEFAULT 0,
      max_win_streak INTEGER NOT NULL DEFAULT 0,
      bonus_pity_count INTEGER DEFAULT 0,
      total_pities_earned INTEGER DEFAULT 0,
      joined_date BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS predictions (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      game_id TEXT NOT NULL,
      pick TEXT NOT NULL,
      bet_amount NUMERIC NOT NULL DEFAULT 0,
      result TEXT,
      gain_loss NUMERIC DEFAULT 0,
      created_at BIGINT NOT NULL,
      UNIQUE(user_id, game_id)
    )
  `)

  console.log('Database initialized')
}
