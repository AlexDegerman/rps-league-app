import pool from '../utils/db.js'
import type { AchievementStats, AchievementDef } from '../types/achievements.js'
import type { BonusSession, SniperSession } from '../types/bonusStage.js'
import { ALL_ACHIEVEMENTS } from '../constants/achievements.js'

const MANUALLY_GRANTED = new Set(['FND'])

export function checkAchievements(
  stats: AchievementStats,
  alreadyEarned: Set<string>
): AchievementDef[] {
  const unlocked: AchievementDef[] = []
  for (const a of ALL_ACHIEVEMENTS) {
    if (alreadyEarned.has(a.code)) continue
    if (MANUALLY_GRANTED.has(a.code)) continue
    if (a.check(stats)) unlocked.push(a)
  }
  return unlocked
}

export async function checkBonusAchievements(
  userId: string,
  session: BonusSession,
  _finalPayout: bigint
): Promise<void> {
  try {
    if (session.stageType === 'SNIPER_CHALLENGE') {
      const grid = session.gridState as
        | (SniperSession & { resolvedZone?: string })
        | null

      if (grid?.resolvedZone === 'bullseye') {
        await pool.query(
          'UPDATE users SET had_perfect_snipe = true WHERE user_id = $1',
          [userId]
        )
      }
    }

    const userResult = await pool.query(
      `SELECT bonus_stages_played, had_perfect_snipe,
        crystal_mine_clears, oracle_vision_perfect_clears,
              double_down_max_clears, wild_prediction_max_combos,
              royal_treasure_chests_opened, royal_kings_chests_found,
              rainbow_tier_rolls, surge_frenzy_max_combo_finishes,
              neon_paradise_minigames_played, neon_full_circuit_today
        FROM users WHERE user_id = $1`,
      [userId]
    )
    const u = userResult.rows[0]
    if (!u) return

    const earnedRes = await pool.query(
      `SELECT achievement_code FROM user_achievements WHERE user_id = $1`,
      [userId]
    )
    const alreadyEarned = new Set<string>(
      earnedRes.rows.map(
        (r: { achievement_code: string }) => r.achievement_code
      )
    )

    const partialStats = {
      bonusStagesPlayed: Number(u.bonus_stages_played ?? 0),
      hadPerfectSnipe: Boolean(u.had_perfect_snipe),
      crystalMineClears: Number(u.crystal_mine_clears ?? 0),
      oracleVisionPerfectClears: Number(u.oracle_vision_perfect_clears ?? 0),
      doubleDownmaxClears: Number(u.double_down_max_clears ?? 0),
      wildPredictionMaxCombos: Number(u.wild_prediction_max_combos ?? 0),
      royalTreasureChestsOpened: Number(u.royal_treasure_chests_opened ?? 0),
      royalKingsChestsFound: Number(u.royal_kings_chests_found ?? 0),
      rainbowTierRolls: Number(u.rainbow_tier_rolls ?? 0),
      surgeFrenzyMaxComboFinishes: Number(
        u.surge_frenzy_max_combo_finishes ?? 0
      ),
      neonParadiseMinigamesPlayed:
        (u.neon_paradise_minigames_played as Record<string, number>) ?? {},
      neonFullCircuitToday: Boolean(u.neon_full_circuit_today)
    } as unknown as AchievementStats

    const newAchievements = ALL_ACHIEVEMENTS.filter(
      (a) =>
        (a.category === 'NEON_PARADISE' || a.code === 'NEON') &&
        !alreadyEarned.has(a.code) &&
        a.check(partialStats)
    )

    if (newAchievements.length === 0) return

    const placeholders = newAchievements
      .map((_, i) => `($1, $${i + 2}, ${Date.now()})`)
      .join(', ')

    await pool.query(
      `INSERT INTO user_achievements (user_id, achievement_code, earned_at)
        VALUES ${placeholders}
        ON CONFLICT DO NOTHING`,
      [userId, ...newAchievements.map((a) => a.code)]
    )

    await pool.query(
      `UPDATE users SET total_achievements = total_achievements + $1
        WHERE user_id = $2`,
      [newAchievements.length, userId]
    )
  } catch (err) {
    console.error('[checkBonusAchievements] error:', err)
  }
}
