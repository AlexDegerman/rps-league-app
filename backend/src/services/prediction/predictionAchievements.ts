import type { PoolClient } from 'pg'
import { checkAchievements } from '../achievementChecker.js'
import { RELICS } from '../relicService.js'
import { hasSeenAllFlashTypes } from '../flashEventService.js'
import type {
  ResolutionContext,
  AchievementEntry
} from '../../types/prediction.js'
import type { AchievementStats } from '../../types/achievements.js'

// Checks and persists newly earned achievements within the open transaction
export const processAchievements = async (
  client: PoolClient,
  ctx: ResolutionContext,
  freshUser: Record<string, unknown>
): Promise<{
  newAchievements: AchievementEntry[]
  autoEquipBadges: boolean
}> => {
  const u = freshUser

  const earnedRes = await client.query<{ achievement_code: string }>(
    `SELECT achievement_code FROM user_achievements WHERE user_id = $1`,
    [ctx.row.user_id]
  )
  const alreadyEarned = new Set<string>(
    earnedRes.rows.map((r) => r.achievement_code)
  )

  // Read relic counts within the transaction before the post-commit relic drop
  const relicCountRes = await client.query<{
    relic_key: string
    rarity: string
  }>('SELECT relic_key, rarity FROM relics WHERE user_id = $1', [
    ctx.row.user_id
  ])
  const userRelicKeys = new Set(relicCountRes.rows.map((r) => r.relic_key))
  const mythCount = relicCountRes.rows.filter(
    (r) => r.rarity === 'MYTHICAL'
  ).length
  const commonRareEpicCount = relicCountRes.rows.filter((r) =>
    ['COMMON', 'RARE', 'EPIC'].includes(r.rarity)
  ).length

  const stats: AchievementStats = {
    wins: Number(u.wins),
    maxWinStreak: Number(u.max_win_streak),
    laps: Number(u.laps),
    points: BigInt(String(u.points)),
    biggestMatchMult: Number(u.biggest_match_mult),
    totalPitiesEarned: Number(u.total_pities_earned),
    lunarCaught: Number(u.lunar_events_caught),
    electricCaught: Number(u.electric_events_caught),
    hellfireCaught: Number(u.hellfire_events_caught),
    cardsCaught: Number(u.cards_events_caught),
    betAgainstOracleCount: Number(u.bet_against_oracle_count),
    oracleMaxStreak: Number(u.oracle_max_streak),
    festivalsTriggered: Number(u.festivals_triggered),
    festivalsParticipated: Number(u.festivals_participated),
    uniqueRelicsOwned: userRelicKeys.size,
    allRelicsOwned: userRelicKeys.size >= RELICS.length,
    allCommonRareEpicRelics: commonRareEpicCount >= 11,
    allMythicalRelics: mythCount >= 3,
    biggestMultiplierTier: null,
    totalAchievementsEarned: alreadyEarned.size,
    hadMythicRelicSlam: ctx.soulProc,
    maxConsecutiveFlashEvents: Number(u.consecutive_flash_peak),
    hasSeenAllFlashTypes: hasSeenAllFlashTypes(ctx.row.user_id),
    hasUsedAutoBet: Boolean(u.has_used_auto_bet),
    globalEventParticipations: Number(u.global_event_participations ?? 0),
    tidalSurgeParticipations: Number(u.tidal_surge_participations ?? 0),
    solarFlareParticipations: Number(u.solar_flare_participations ?? 0),
    cycloneBlitzParticipations: Number(u.cyclone_blitz_participations ?? 0),
    mirageCataclysmParticipations: Number(
      u.mirage_cataclysm_participations ?? 0
    ),
    maxStreakDuringTidalSurge: Number(u.max_streak_during_tidal_surge ?? 0),
    maxStreakDuringCycloneBlitz: Number(u.max_streak_during_cyclone_blitz ?? 0),
    hadFlareInfernoCombo: Boolean(u.had_flare_inferno_combo),
    hadMirageHighEcho: Boolean(u.had_mirage_high_echo),
    hadFlashPlusGlobalWin: Boolean(u.had_flash_plus_global_win),
    hadDryMirage: Boolean(u.had_dry_mirage),
    hadEyeOfStorm: Boolean(u.had_eye_of_storm),
    hadPrismaticWave: Boolean(u.had_prismatic_wave),
    hadThermalFusion: Boolean(u.had_thermal_fusion),
    worldBossKills: Number(u.boss_kills_total ?? 0),
    hexurionKills: Number(u.hexurion_kills ?? 0),
    orphionKills: Number(u.orphion_kills ?? 0),
    fracturonKills: Number(u.fracturon_kills ?? 0),
    apexionKills: Number(u.apexion_kills ?? 0),
    worldBossChestsOpened: Number(u.world_boss_chests_opened ?? 0),
    hadFinalStrike: Boolean(u.had_final_strike),
    hadPerfectAssault: Boolean(u.had_perfect_assault),
    hadLuckyShot: Boolean(u.had_lucky_shot),
    hadClutchVictory: Boolean(u.had_clutch_victory),
    hadDivineIntervention: Boolean(u.had_divine_intervention),
    bonusStagesPlayed: Number(u.bonus_stages_played ?? 0),
    crystalMineClears: Number(u.crystal_mine_clears ?? 0),
    oracleVisionPerfectClears: Number(u.oracle_vision_perfect_clears ?? 0),
    doubleDownmaxClears: Number(u.double_down_max_clears ?? 0),
    wildPredictionMaxCombos: Number(u.wild_prediction_max_combos ?? 0),
    royalTreasureChestsOpened: Number(u.royal_treasure_chests_opened ?? 0),
    royalKingsChestsFound: Number(u.royal_kings_chests_found ?? 0),
    hadPerfectSnipe: Boolean(u.had_perfect_snipe),
    rainbowTierRolls: Number(u.rainbow_tier_rolls ?? 0),
    surgeFrenzyMaxComboFinishes: Number(u.surge_frenzy_max_combo_finishes ?? 0),
    neonParadiseMinigamesPlayed:
      (u.neon_paradise_minigames_played as Record<string, number>) ?? {},
    neonFullCircuitToday: Boolean(u.neon_full_circuit_today)
  }

  const firstPass = checkAchievements(stats, alreadyEarned)
  const projectedTotal = alreadyEarned.size + firstPass.length
  const statsPass2 = { ...stats, totalAchievementsEarned: projectedTotal }
  const collectorPass = checkAchievements(
    statsPass2,
    new Set([...alreadyEarned, ...firstPass.map((a) => a.code)])
  )
  const newAchievements = [...firstPass, ...collectorPass]

  if (newAchievements.length > 0) {
    const placeholders = newAchievements
      .map((_, i) => `($1, $${i + 2}, ${Date.now()})`)
      .join(', ')

    await client.query(
      `INSERT INTO user_achievements (user_id, achievement_code, earned_at)
        VALUES ${placeholders}
        ON CONFLICT DO NOTHING`,
      [ctx.row.user_id, ...newAchievements.map((a) => a.code)]
    )

    await client.query(
      `UPDATE users SET total_achievements = total_achievements + $1 WHERE user_id = $2`,
      [newAchievements.length, ctx.row.user_id]
    )
  }

  return { newAchievements, autoEquipBadges: Boolean(u.auto_equip_badges) }
}
