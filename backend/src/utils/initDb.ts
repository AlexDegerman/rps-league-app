import pool from './db.js'
import { logger } from './logger.js'

export const initDb = async (): Promise<void> => {
  try {
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
        short_id TEXT NOT NULL UNIQUE,
        points NUMERIC NOT NULL DEFAULT 200000,
        peak_points NUMERIC NOT NULL DEFAULT 200000,
        all_time_peak NUMERIC NOT NULL DEFAULT 200000,
        daily_peak NUMERIC DEFAULT 100000,
        weekly_peak NUMERIC DEFAULT 100000,
        nickname TEXT,
        recovery_code TEXT UNIQUE,
        total_volume NUMERIC NOT NULL DEFAULT 0,
        biggest_win NUMERIC NOT NULL DEFAULT 0,
        current_win_streak INTEGER NOT NULL DEFAULT 0,
        max_win_streak INTEGER NOT NULL DEFAULT 0,
        wins INTEGER NOT NULL DEFAULT 0,
        losses INTEGER NOT NULL DEFAULT 0,
        bonus_pity_count INTEGER DEFAULT 0,
        total_pities_earned INTEGER DEFAULT 0,
        joined_date BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
        linkedin_url TEXT,
        show_linkedin_badge BOOLEAN DEFAULT true,
        biggest_single_win NUMERIC NOT NULL DEFAULT 0,
        biggest_multiplier_win NUMERIC NOT NULL DEFAULT 0,
        biggest_multiplier_tier TEXT,
        biggest_match_mult NUMERIC NOT NULL DEFAULT 0,
        total_flash_events_caught INTEGER NOT NULL DEFAULT 0,
        lunar_events_caught INTEGER NOT NULL DEFAULT 0,
        electric_events_caught INTEGER NOT NULL DEFAULT 0,
        hellfire_events_caught INTEGER NOT NULL DEFAULT 0,
        cards_events_caught INTEGER NOT NULL DEFAULT 0,
        first_flash_triggered BOOLEAN NOT NULL DEFAULT false,
        consecutive_flash_streak INTEGER NOT NULL DEFAULT 0,
        consecutive_flash_peak INTEGER NOT NULL DEFAULT 0,
        festivals_participated INTEGER NOT NULL DEFAULT 0,
        festivals_triggered INTEGER NOT NULL DEFAULT 0,
        laps INTEGER NOT NULL DEFAULT 0,
        fastest_lap_bets INTEGER,
        total_bets_at_last_ascension INTEGER NOT NULL DEFAULT 0,
        equipped_relic TEXT,
        relic_cycle_counter INTEGER DEFAULT 0,
        oracle_used_date TEXT,
        oracle_streak INTEGER NOT NULL DEFAULT 0,
        oracle_max_streak INTEGER NOT NULL DEFAULT 0,
        bet_against_oracle_count INTEGER NOT NULL DEFAULT 0,
        point_style_preference TEXT,
        displayed_badges TEXT[] NOT NULL DEFAULT '{}',
        total_achievements INTEGER NOT NULL DEFAULT 0,
        has_used_auto_bet BOOLEAN NOT NULL DEFAULT false,
        utm_source TEXT,
        recovery_tutorial_completed BOOLEAN DEFAULT false
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
        bonus_tier TEXT,
        bonus_multiplier NUMERIC DEFAULT 0,
        created_at BIGINT NOT NULL,
        flash_event_type TEXT,
        flash_multiplier NUMERIC DEFAULT 1,
        streak_multiplier NUMERIC DEFAULT 1,
        relic_multiplier INTEGER NOT NULL DEFAULT 1,
        festival_multiplier NUMERIC DEFAULT 1,
        festival_type TEXT,
        total_multiplier NUMERIC DEFAULT 1,
        bet_against_oracle BOOLEAN DEFAULT false,
        UNIQUE(user_id, game_id)
      )
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS relics (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        relic_key TEXT NOT NULL,
        rarity TEXT NOT NULL,
        found_at BIGINT NOT NULL,
        counter INTEGER DEFAULT 0,
        CONSTRAINT relics_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id)
      )
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        user_id TEXT NOT NULL,
        achievement_code TEXT NOT NULL,
        earned_at BIGINT NOT NULL DEFAULT ((EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT),
        PRIMARY KEY (user_id, achievement_code),
        CONSTRAINT user_achievements_user_fkey FOREIGN KEY (user_id) REFERENCES users(user_id)
      )
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS utm_visits (
        id SERIAL PRIMARY KEY,
        utm_source TEXT NOT NULL,
        referrer TEXT,
        visited_at TIMESTAMPTZ DEFAULT now()
      )
    `)
    await pool.query(
      `ALTER TABLE utm_visits ADD COLUMN IF NOT EXISTS referrer TEXT`
    )
    await pool.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_referrer TEXT`
    )
    await pool.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS auto_equip_badges BOOLEAN NOT NULL DEFAULT true`
    )

    await pool.query(`
      CREATE TABLE IF NOT EXISTS feedback_bans (
        user_id TEXT NOT NULL,
        banned_at TIMESTAMPTZ DEFAULT now(),
        CONSTRAINT feedback_bans_pkey PRIMARY KEY (user_id)
      )
    `)

    // Indexes - predictions
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_predictions_user_created
        ON predictions(user_id, created_at DESC)
    `)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_predictions_created_at
        ON predictions(created_at)
    `)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_predictions_game_id
        ON predictions(game_id)
    `)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_predictions_result_user
        ON predictions(result, user_id)
    `)
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_predictions_user_game
        ON predictions(user_id, game_id)
    `)

    // Indexes - users
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_points
        ON users(points)
    `)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_peak_points
        ON users(peak_points)
    `)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_laps_points
        ON users(laps, points DESC)
    `)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_all_time_peak
        ON users(all_time_peak DESC)
    `)

    // Indexes - matches
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_matches_time
        ON matches(time)
    `)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_matches_time_desc
        ON matches(time DESC)
    `)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_matches_game_id
        ON matches(game_id)
    `)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_matches_player_a
        ON matches(player_a_name)
    `)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_matches_player_b
        ON matches(player_b_name)
    `)

    // Indexes - relics / achievements
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_relics_user_id
        ON relics(user_id)
    `)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id
        ON user_achievements(user_id)
    `)
    // Participation counters (incremented via POST /api/global-events/participated)
    await pool.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS global_event_participations   INTEGER NOT NULL DEFAULT 0`
    )
    await pool.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS tidal_surge_participations    INTEGER NOT NULL DEFAULT 0`
    )
    await pool.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS solar_flare_participations    INTEGER NOT NULL DEFAULT 0`
    )
    await pool.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS cyclone_blitz_participations  INTEGER NOT NULL DEFAULT 0`
    )
    await pool.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS mirage_cataclysm_participations INTEGER NOT NULL DEFAULT 0`
    )

    // Streak-during-event peaks (TIDE: 3-consec in Tidal, CYCL: 10-streak in Cyclone)
    await pool.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS max_streak_during_tidal_surge   INTEGER NOT NULL DEFAULT 0`
    )
    await pool.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS max_streak_during_cyclone_blitz INTEGER NOT NULL DEFAULT 0`
    )

    // One-way latch booleans for standalone Meta + hidden Misc achievements
    await pool.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS had_flare_inferno_combo   BOOLEAN NOT NULL DEFAULT false`
    )
    await pool.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS had_mirage_high_echo      BOOLEAN NOT NULL DEFAULT false`
    )
    await pool.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS had_flash_plus_global_win BOOLEAN NOT NULL DEFAULT false`
    )
    await pool.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS had_dry_mirage            BOOLEAN NOT NULL DEFAULT false`
    )
    await pool.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS had_eye_of_storm          BOOLEAN NOT NULL DEFAULT false`
    )
    await pool.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS had_prismatic_wave        BOOLEAN NOT NULL DEFAULT false`
    )
    await pool.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS had_thermal_fusion        BOOLEAN NOT NULL DEFAULT false`
    )

    logger.info('Database initialized')
  } catch (err) {
    logger.error('Database initialization failed', err)
    throw err // re-throw - app should not start with broken schema
  }
}
