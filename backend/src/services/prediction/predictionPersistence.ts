import type { PoolClient } from 'pg'
import { consumeOracleForUser } from '../oracleProphecyService.js'
import type { ResolutionContext } from '../../types/prediction.js'

// Persists the prediction resolution and updated user state atomically
export const persistPredictionResolution = async (
  client: PoolClient,
  ctx: ResolutionContext
): Promise<Record<string, unknown>> => {
  // Persist the cycle counter for relics that use it
  const relicUpdatesCounter =
    ctx.equippedRelic === 'logic_gate' ||
    ctx.equippedRelic === 'kinetic_capacitor' ||
    ctx.equippedRelic === 'buffer_module'

  if (relicUpdatesCounter && ctx.equippedRelic) {
    await client.query(
      'UPDATE relics SET counter = $1 WHERE user_id = $2 AND relic_key = $3',
      [ctx.cycleCounter, ctx.row.user_id, ctx.equippedRelic]
    )
  }

  await client.query(
    `UPDATE predictions
      SET result             = $1,
          gain_loss          = $2,
          bonus_tier         = $3,
          bonus_multiplier   = $4,
          flash_event_type   = $7,
          flash_multiplier   = $8,
          streak_multiplier  = $9,
          relic_multiplier   = $10,
          total_multiplier   = $11,
          festival_multiplier = $12,
          festival_type      = $13,
          global_event_type  = $14,
          global_echo_amount = $15
      WHERE user_id = $5 AND game_id = $6`,
    [
      ctx.result,
      ctx.gainLoss.toString(),
      ctx.effectiveBonus ? ctx.effectiveBonus.tier : null,
      ctx.effectiveBonus ? ctx.effectiveBonus.multiplier : 1,
      ctx.row.user_id,
      ctx.row.game_id,
      ctx.savedFlashType,
      ctx.flashJustEndedFlag ? 1 : ctx.flashMult,
      Number(ctx.streakNum),
      ctx.soulProc ? 3 : ctx.kineticFired ? 2 : 1,
      ctx.finalCombinedMult,
      ctx.festivalMultValue,
      ctx.festivalType,
      ctx.activeGlobalEventType,
      ctx.globalEchoAmount > 0n ? ctx.globalEchoAmount.toString() : null
    ]
  )

  const userRes = await client.query<Record<string, unknown>>(
    `UPDATE users
      SET points                    = points + $1,
          peak_points               = GREATEST(peak_points, points + $1),
          all_time_peak             = GREATEST(all_time_peak, points + $1),
          daily_peak                = GREATEST(daily_peak,  points + $1),
          weekly_peak               = GREATEST(weekly_peak, points + $1),
          bonus_pity_count          = $3,
          total_volume              = total_volume + $4,
          festivals_participated    = festivals_participated + CASE WHEN $12 THEN 1 ELSE 0 END,
          biggest_win               = CASE WHEN $5 = 'WIN' THEN GREATEST(biggest_win, $1) ELSE biggest_win END,
          biggest_single_win        = CASE WHEN $5 = 'WIN' THEN GREATEST(biggest_single_win, $1) ELSE biggest_single_win END,
          current_win_streak        = $14,
          max_win_streak            = CASE WHEN $5 = 'WIN' THEN GREATEST(max_win_streak, $14) ELSE max_win_streak END,
          consecutive_flash_streak  = CASE
                                        WHEN $13 THEN consecutive_flash_streak + 1
                                        ELSE 0
                                      END,
          consecutive_flash_peak    = CASE
                                        WHEN $13 THEN GREATEST(consecutive_flash_peak, consecutive_flash_streak + 1)
                                        ELSE consecutive_flash_peak
                                      END,
          total_pities_earned       = total_pities_earned + $6,
          total_flash_events_caught = CASE WHEN $7::text IS NOT NULL AND $5 = 'WIN' THEN total_flash_events_caught + 1 ELSE total_flash_events_caught END,
          wins                      = CASE WHEN $5 = 'WIN' THEN wins + 1 ELSE wins END,
          losses                    = CASE WHEN $5 = 'LOSE' THEN losses + 1 ELSE losses END,
          lunar_events_caught       = CASE WHEN $7 = 'LUNAR'    AND $5 = 'WIN' THEN lunar_events_caught    + 1 ELSE lunar_events_caught    END,
          electric_events_caught    = CASE WHEN $7 = 'ELECTRIC' AND $5 = 'WIN' THEN electric_events_caught + 1 ELSE electric_events_caught END,
          hellfire_events_caught    = CASE WHEN $7 = 'HELLFIRE' AND $5 = 'WIN' THEN hellfire_events_caught + 1 ELSE hellfire_events_caught END,
          cards_events_caught       = CASE WHEN $7 = 'CARDS'    AND $5 = 'WIN' THEN cards_events_caught    + 1 ELSE cards_events_caught    END,
          biggest_match_mult        = GREATEST(biggest_match_mult, $8),
          bet_against_oracle_count  = CASE WHEN $9 THEN bet_against_oracle_count + 1 ELSE bet_against_oracle_count END,
          oracle_streak             = CASE WHEN $10 THEN oracle_streak + 1 WHEN $11 THEN 0 ELSE oracle_streak END,
          oracle_max_streak         = CASE WHEN $10 THEN GREATEST(oracle_max_streak, oracle_streak + 1) ELSE oracle_max_streak END,
          had_flare_inferno_combo   = had_flare_inferno_combo   OR $15,
          had_mirage_high_echo      = had_mirage_high_echo      OR $16,
          had_flash_plus_global_win = had_flash_plus_global_win OR $17,
          had_dry_mirage            = had_dry_mirage            OR $18,
          had_eye_of_storm          = had_eye_of_storm          OR $19,
          had_prismatic_wave        = had_prismatic_wave        OR $20,
          had_thermal_fusion        = had_thermal_fusion        OR $21,
          max_streak_during_tidal_surge   = GREATEST(max_streak_during_tidal_surge,   $22),
          max_streak_during_cyclone_blitz = GREATEST(max_streak_during_cyclone_blitz, $23)
      WHERE user_id = $2
      RETURNING
        wins, max_win_streak, laps, points,
        biggest_match_mult, total_pities_earned,
        lunar_events_caught, electric_events_caught,
        hellfire_events_caught, cards_events_caught,
        bet_against_oracle_count, oracle_max_streak,
        festivals_triggered, festivals_participated, consecutive_flash_peak, has_used_auto_bet,
        max_streak_during_tidal_surge, max_streak_during_cyclone_blitz,
        had_flare_inferno_combo, had_mirage_high_echo, had_flash_plus_global_win,
        had_dry_mirage, had_eye_of_storm, had_prismatic_wave, had_thermal_fusion,
        tidal_surge_participations, solar_flare_participations,
        cyclone_blitz_participations, mirage_cataclysm_participations,
        global_event_participations,
        displayed_badges, auto_equip_badges, show_linkedin_badge,
        boss_kills_total, hexurion_kills, orphion_kills,
        fracturon_kills, apexion_kills, world_boss_chests_opened,
        had_final_strike, had_perfect_assault, had_lucky_shot,
        had_clutch_victory, had_divine_intervention`,
    [
      ctx.gainLoss.toString(),
      ctx.row.user_id,
      ctx.effectiveBonus ? 0 : ctx.currentPity + 1,
      ctx.bet.toString(),
      ctx.result,
      ctx.isNaturalPityHit ? 1 : 0,
      ctx.savedFlashType,
      ctx.finalCombinedMult,
      ctx.betAgainstOracle,
      ctx.oracleRigged,
      ctx.defiedOracle,
      ctx.activeFestivalExists,
      ctx.flashJustEndedFlag,
      ctx.streakAfter,
      ctx.triggerFlareInfernoCombo,
      ctx.triggerMirageHighEcho,
      ctx.triggerFlashPlusGlobalWin,
      ctx.triggerDryMirage,
      ctx.triggerEyeOfStorm,
      ctx.triggerPrismaticWave,
      ctx.triggerThermalFusion,
      ctx.streakDuringTidal,
      ctx.streakDuringCyclone
    ]
  )

  // Consume Arkalon charge atomically with the resolution
  if (ctx.oracleRigged || ctx.defiedOracle) {
    await consumeOracleForUser(ctx.row.user_id, client)
  }

  const updatedUser = userRes.rows[0]
  if (!updatedUser) {
    throw new Error(
      `Failed to update user stats for user_id: ${ctx.row.user_id}`
    )
  }

  return updatedUser
}
