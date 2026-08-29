import pool from '../utils/db.js'
import { getOrCreateUser } from './userService.js'
import {
  getFlashEventForUser,
  consumeFlashBetForUser,
  restoreFlashEventForUser,
  tryTriggerFlashEventForUser,
  recordSessionFlashType,
  hasSeenAllFlashTypes
} from './flashEventService.js'
import { logger } from '../utils/logger.js'
import {
  consumeOracleForUser,
  getOracleState,
  hasUserUsedOracle
} from './oracleProphecyService.js'
import {
  checkAndTriggerFestival,
  getGuaranteedBonusRemaining,
  consumeGuaranteedBonus,
  getActiveFestival,
  triggerVaultFestival,
  triggerSafeguardFestival
} from './festivalService.js'
import {
  checkAchievements,
  type AchievementStats
} from './achievementChecker.js'
import { RELICS, rollRelicDrop } from './relicService.js'
import {
  applyGlobalEventBuff,
  getActiveGlobalEvent,
  type GlobalEventBuffResult
} from './globalEventService.js'
import { recordInteraction } from './sessionService.js'
import { autoEquipUserBadges } from '../utils/badgeHelper.js'
import {
  isWorldBossActive,
  getCurrentState as getBossState,
  registerParticipant,
  recordMiss,
  applyDamage
} from './worldBossService.js'
import {
  rollBonusTrigger,
  createSession,
  getActiveSession,
  getClientInitialData
} from './bonusStageService.js'
import type { PoolClient } from 'pg'

const POINTS_FLOOR = 100000n
// Architect's Keystone upgrades a bonus to MYTHICAL at this multiplier
const MYTHICAL_MULTIPLIER = 7.0
const TIER_UPGRADE: Record<string, string> = {
  COMMON: 'RARE',
  RARE: 'EPIC',
  EPIC: 'LEGENDARY',
  LEGENDARY: 'MYTHICAL'
}

interface PredictionRow {
  user_id: string
  game_id: string
  pick: string
  bet_amount: string
  bet_against_oracle: boolean
  nickname: string | null
  current_points: string
  bonus_pity_count: string
  current_win_streak: string
  equipped_relic: string | null
  relic_counter: string | null
  total_bets: string
  player_a_name: string
  player_b_name: string
}

// Gameplay state computed before persistence and reused across post-commit processing
interface ResolutionContext {
  row: PredictionRow
  isWin: boolean
  result: 'WIN' | 'LOSE'
  oracleRigged: boolean
  defiedOracle: boolean
  currentPoints: bigint
  bet: bigint
  currentPity: number
  isNaturalPityHit: boolean
  equippedRelic: string | null
  betAgainstOracle: boolean
  flashEventType: string | null
  flashActive: boolean
  snapshotRelic: string | null
  flashMult: number
  flashJustEndedFlag: boolean
  savedFlashType: string | null
  effectiveBonus: { multiplier: number; tier: string } | null
  // Final relic cycle counter value for the equipped relic
  cycleCounter: number
  logicGateFired: boolean
  kineticFired: boolean
  streakShielded: boolean
  streakAfter: number
  streakMult: bigint
  streakNum: number
  gainLoss: bigint
  bonusDisplayAmount: bigint
  ghostEchoAmount: bigint
  preKineticAmount: bigint
  preSoulAmount: bigint
  soulProc: boolean
  globalBuff: GlobalEventBuffResult | null
  globalEchoAmount: bigint
  activeGlobalEventType: string | null
  finalCombinedMult: number
  festivalType: string | null
  festivalMultValue: number
  isSolarFlareActive: boolean
  triggerFlareInfernoCombo: boolean
  triggerMirageHighEcho: boolean
  triggerFlashPlusGlobalWin: boolean
  triggerDryMirage: boolean
  triggerEyeOfStorm: boolean
  triggerPrismaticWave: boolean
  triggerThermalFusion: boolean
  streakDuringTidal: number
  streakDuringCyclone: number
  activeFestivalExists: boolean
  resonanceActive: boolean
}

type AchievementEntry = {
  code: string
  name: string
  icon: string
  rarity: string
  category: string
  requirement: string
}

export const savePrediction = async (
  userId: string,
  gameId: string,
  pick: string,
  betAmount: bigint,
  nickname: string,
  shortId: string
): Promise<{ success: boolean; error?: string }> => {
  const { points: balance } = await getOrCreateUser(userId, shortId)

  if (betAmount <= 0n) return { success: false, error: 'Invalid bet amount' }
  if (betAmount > balance)
    return { success: false, error: 'Bet could not be processed' }

  try {
    const nameCheck = await pool.query(
      `SELECT user_id FROM users WHERE nickname = $1 AND user_id != $2`,
      [nickname, userId]
    )

    if (nameCheck.rows.length > 0) {
      return { success: false, error: 'Nickname unavailable' }
    }

    const matchRes = await pool.query(
      `SELECT expires_at, player_a_name, player_b_name FROM matches WHERE game_id = $1`,
      [gameId]
    )
    if (matchRes.rows.length === 0)
      return { success: false, error: 'Invalid match' }
    const GRACE_MS = 400
    if (Date.now() > Number(matchRes.rows[0].expires_at) + GRACE_MS)
      return { success: false, error: 'Selection window closed' }

    const oracleUsed = await hasUserUsedOracle(userId)
    let betAgainstOracle = false
    if (!oracleUsed) {
      const oracleState = getOracleState()
      const oracleWinnerName =
        oracleState.side === 'left'
          ? matchRes.rows[0].player_a_name
          : matchRes.rows[0].player_b_name
      betAgainstOracle = pick !== oracleWinnerName
    }

    await pool.query(`UPDATE users SET nickname = $1 WHERE user_id = $2`, [
      nickname,
      userId
    ])

    const insertResult = await pool.query(
      `INSERT INTO predictions (user_id, game_id, pick, bet_amount, created_at, bet_against_oracle)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id, game_id) DO NOTHING`,
      [userId, gameId, pick, betAmount.toString(), Date.now(), betAgainstOracle]
    )

    if (insertResult.rowCount === 0)
      return { success: false, error: 'BET ALREADY PLACED' }

    recordInteraction(userId, 'prediction').catch(() => {})

    return { success: true }
  } catch (err) {
    logger.errorWithPoints('savePrediction failed', err, {
      userId,
      gameId,
      points: balance,
      betAmount
    })
    return { success: false, error: 'Internal error' }
  }
}

// 40% chance of a bonus (80% under 2M points). Tier determines multiplier range
const rollBonus = (
  isWin: boolean,
  pityCount: number,
  currentPoints: bigint,
  userId: string,
  flashType?: string | null,
  equippedRelic?: string | null
): { multiplier: number; tier: string } | null => {
  // CARDS flash event: always legendary on wins
  if (flashType === 'CARDS' && isWin) {
    return { multiplier: 5.0, tier: 'LEGENDARY' }
  }

  const forceBonus = pityCount >= 3
  // Spark Festival: guaranteed bonus on next 3 bets for streak-trigger initiator
  const hasGuaranteedBonus = isWin && getGuaranteedBonusRemaining(userId) > 0
  if (hasGuaranteedBonus) consumeGuaranteedBonus(userId)

  const baseChance = currentPoints < 2000000n ? 0.8 : 0.4
  const extraChance = equippedRelic === 'precision_bearing' ? 0.1 : 0.0
  const finalChance = baseChance + extraChance

  if (!forceBonus && !hasGuaranteedBonus && Math.random() > finalChance)
    return null

  const roll = Math.random() * 100

  const isBiased = equippedRelic === 'biased_oscillator'
  const commonThreshold = isBiased ? 58.4 : 59.5
  const rareThreshold = isBiased ? 83.0 : 84.5
  const epicThreshold = isBiased ? 97.3 : 97.5
  const legendaryThreshold = 99.5

  if (roll < commonThreshold) {
    // COMMON: Win 1.5-2.2x | Loss: Save 10-25% (User loses 75-90% of base loss)
    return {
      multiplier: isWin
        ? 1.5 + Math.random() * 0.7
        : 0.1 + Math.random() * 0.15,
      tier: 'COMMON'
    }
  }
  if (roll < rareThreshold) {
    // RARE: Win 2.2-3.2x | Loss: Save 25-50% (User loses 50-75% of base loss)
    return {
      multiplier: isWin
        ? 2.2 + Math.random() * 1.0
        : 0.25 + Math.random() * 0.25,
      tier: 'RARE'
    }
  }
  if (roll < epicThreshold) {
    // EPIC: Win 3.2-4.2x | Loss: Save 60-90% (User loses 10-40% of base loss)
    return {
      multiplier: isWin ? 3.2 + Math.random() * 1.0 : 0.6 + Math.random() * 0.3,
      tier: 'EPIC'
    }
  }
  if (roll < legendaryThreshold) {
    // LEGENDARY: Win 5.0x | Loss: Save 100% (User loses 0)
    return {
      multiplier: isWin ? 5.0 : 1.0,
      tier: 'LEGENDARY'
    }
  }
  // MYTHICAL: Win 7x | Loss: Save 100%, primarily via Architect's Keystone
  return {
    multiplier: isWin ? MYTHICAL_MULTIPLIER : 1.0,
    tier: 'MYTHICAL'
  }
}

/**
 * Fetches all unresolved predictions for a match with the per-bettor state
 * needed for resolution. Single JOIN avoids N+1 queries per bettor
 */
const fetchPendingPredictions = async (
  gameId: string
): Promise<PredictionRow[]> => {
  const result = await pool.query<PredictionRow>(
    `SELECT
      p.*,
      u.nickname,
      u.points AS current_points,
      u.bonus_pity_count,
      u.current_win_streak,
      u.equipped_relic,
      r.counter AS relic_counter,
      (SELECT COUNT(*) FROM predictions WHERE user_id = p.user_id) AS total_bets,
      m.player_a_name,
      m.player_b_name
    FROM predictions p
    JOIN users u ON p.user_id = u.user_id
    JOIN matches m ON p.game_id = m.game_id
    LEFT JOIN relics r ON (r.user_id = u.user_id AND r.relic_key = u.equipped_relic)
    WHERE p.game_id = $1 AND p.result IS NULL`,
    [gameId]
  )
  return result.rows
}


// Calculates the complete gameplay outcome from the supplied prediction state
const calculatePredictionResolution = (
  row: PredictionRow,
  winnerName: string,
  oracleRigged: boolean,
  defiedOracle: boolean,
  flashJustEndedFlag: boolean,
  // Snapshot of the flash event before its bet count is consumed
  flashEventSnapshot: ReturnType<typeof getFlashEventForUser>
): ResolutionContext => {
  const flashEvent = flashEventSnapshot
  const flashEventType = flashEvent?.type ?? null
  const flashActive = !!flashEvent
  const snapshotRelic = flashEvent?.snapshotRelic ?? null

  const activeFestival = getActiveFestival()
  const sanguineActive = activeFestival?.type === 'SANGUINE'
  const feverActive = activeFestival?.type === 'FEVER'
  const resonanceActive = activeFestival?.type === 'RESONANCE'

  const activeGlobalEvent = getActiveGlobalEvent()
  const isSolarFlareActive =
    activeGlobalEvent?.type === 'SOLAR_FLARE' &&
    activeGlobalEvent.phase === 'active'

  const currentPoints = BigInt(row.current_points)
  const bet = BigInt(row.bet_amount)
  const totalBets = Number(row.total_bets)
  const currentPity = Number(row.bonus_pity_count)
  const isNaturalPityHit = currentPity >= 3
  const equippedRelic = row.equipped_relic as string | null
  const betAgainstOracle = Boolean(row.bet_against_oracle)

  const result: 'WIN' | 'LOSE' = oracleRigged
    ? 'WIN'
    : defiedOracle
      ? 'LOSE'
      : sanguineActive || flashActive
        ? 'WIN'
        : row.pick === winnerName
          ? 'WIN'
          : 'LOSE'
  const isWin = result === 'WIN'

  let bonus = rollBonus(
    isWin,
    resonanceActive ? 3 : totalBets <= 3 ? 3 : currentPity,
    currentPoints,
    row.user_id,
    flashEventType,
    equippedRelic
  )

  let cycleCounter = Number(row.relic_counter ?? 0)

  // LOGIC GATE: every 20 wins guarantees a Legendary bonus while the relic is equipped
  let logicGateFired = false
  if (equippedRelic === 'logic_gate' && isWin) {
    cycleCounter++
    if (cycleCounter % 20 === 0) {
      bonus = { multiplier: 5.0, tier: 'LEGENDARY' }
      logicGateFired = true
    }
  }

  // ARCHITECT'S KEYSTONE: auto-upgrade bonus tier
  if (equippedRelic === 'architects_keystone' && bonus) {
    const upgraded = TIER_UPGRADE[bonus.tier]
    if (upgraded) {
      bonus = {
        multiplier:
          upgraded === 'MYTHICAL' ? MYTHICAL_MULTIPLIER : bonus.multiplier,
        tier: upgraded
      }
    }
  }

  // Resonance cap: clamp to RARE max
  const effectiveBonus =
    resonanceActive && bonus
      ? bonus.tier === 'EPIC' ||
        bonus.tier === 'LEGENDARY' ||
        bonus.tier === 'MYTHICAL'
        ? {
            multiplier: isWin
              ? 2.2 + Math.random() * 1.0
              : 0.25 + Math.random() * 0.25,
            tier: 'RARE'
          }
        : bonus
      : bonus

  // KINETIC CAPACITOR: every 30 wins grants x2 after all other multipliers while the relic is equipped
  let kineticFired = false
  if (equippedRelic === 'kinetic_capacitor' && isWin && !logicGateFired) {
    cycleCounter++
    if (cycleCounter % 30 === 0) kineticFired = true
  }

  // BUFFER MODULE: every 15 matches grants a streak shield on the next loss while the relic is equipped
  let streakShielded = false
  if (equippedRelic === 'buffer_module') {
    cycleCounter++
    if (!isWin && cycleCounter % 15 === 0) streakShielded = true
  }

  let streakAfter = isWin
    ? Number(row.current_win_streak) + 1
    : feverActive || streakShielded
      ? Number(row.current_win_streak)
      : 0

  const streakMult =
    streakAfter >= 5 ? 5n : streakAfter >= 4 ? 3n : streakAfter >= 3 ? 2n : 1n

  const streakNum = Number(streakMult)
  let flashMult = isWin && flashEvent ? flashEvent.multiplier : 1

  if (isWin && flashEvent) {
    if (snapshotRelic === 'lunar_siphon' && flashEventType === 'LUNAR')
      flashMult += 0.5
    if (snapshotRelic === 'static_inductor' && flashEventType === 'ELECTRIC')
      flashMult += 0.5
    if (snapshotRelic === 'volcanic_mantle' && flashEventType === 'HELLFIRE')
      flashMult += 0.5
    if (snapshotRelic === 'dealers_hand' && flashEventType === 'CARDS')
      flashMult += 0.3
    if (snapshotRelic === 'overdrive_relay') flashMult += 0.5
  }

  const bonusMultScale = effectiveBonus
    ? BigInt(Math.floor(effectiveBonus.multiplier * 100))
    : 100n
  const flashMultScale =
    isWin && flashEvent ? BigInt(Math.floor(flashMult * 100)) : 100n

  const baseChange = isWin ? bet : bet / 2n

  let gainLoss: bigint
  let bonusDisplayAmount = 0n
  let ghostEchoAmount = 0n
  let preKineticAmount = 0n
  let preSoulAmount = 0n
  let soulProc = false
  let globalBuff: GlobalEventBuffResult | null = null
  let globalEchoAmount = 0n
  let activeGlobalEventType: string | null = null

  if (isWin) {
    const afterStreak = baseChange * streakMult
    const afterFlash = (afterStreak * flashMultScale) / 100n
    const afterBonus = (afterFlash * bonusMultScale) / 100n

    gainLoss = isSolarFlareActive ? afterBonus * 2n : afterBonus

    let gainLossWithoutBonus = isSolarFlareActive ? afterFlash * 2n : afterFlash

    // Prevent intermediate win calculations from falling below the points floor
    const provisionalPoints = currentPoints + gainLoss
    if (provisionalPoints < POINTS_FLOOR) {
      gainLoss = POINTS_FLOOR - currentPoints
    }
    const provisionalPointsWithout = currentPoints + gainLossWithoutBonus
    if (provisionalPointsWithout < POINTS_FLOOR) {
      gainLossWithoutBonus = POINTS_FLOOR - currentPoints
    }

    // Ghost Festival (+20%)
    if (activeFestival?.type === 'GHOST') {
      ghostEchoAmount = gainLoss / 5n
      gainLoss = gainLoss + ghostEchoAmount
      const provisionalWithEcho = currentPoints + gainLoss
      if (provisionalWithEcho < POINTS_FLOOR) {
        gainLoss = POINTS_FLOOR - currentPoints
        ghostEchoAmount = 0n
      }

      const ghostEchoWithout = gainLossWithoutBonus / 5n
      gainLossWithoutBonus = gainLossWithoutBonus + ghostEchoWithout
      const provisionalWithEchoWithout = currentPoints + gainLossWithoutBonus
      if (provisionalWithEchoWithout < POINTS_FLOOR) {
        gainLossWithoutBonus = POINTS_FLOOR - currentPoints
      }
    }

    // Surge Festival (2x)
    if (activeFestival?.type === 'SURGE') {
      gainLoss = gainLoss * 2n
      const provisionalWithSurge = currentPoints + gainLoss
      if (provisionalWithSurge < POINTS_FLOOR) {
        gainLoss = POINTS_FLOOR - currentPoints
      }

      gainLossWithoutBonus = gainLossWithoutBonus * 2n
      const provisionalWithSurgeWithout = currentPoints + gainLossWithoutBonus
      if (provisionalWithSurgeWithout < POINTS_FLOOR) {
        gainLossWithoutBonus = POINTS_FLOOR - currentPoints
      }
    }

    // Prismatic Shard (+0.5x bet)
    if (equippedRelic === 'prismatic_shard' && !flashActive) {
      gainLoss = gainLoss + bet / 2n
      gainLossWithoutBonus = gainLossWithoutBonus + bet / 2n
    }

    // Kinetic Capacitor (2x)
    preKineticAmount = gainLoss
    if (kineticFired) {
      gainLoss = gainLoss * 2n
      gainLossWithoutBonus = gainLossWithoutBonus * 2n
    }

    // Soul of the Machine (3x)
    preSoulAmount = gainLoss
    if (equippedRelic === 'soul_of_the_machine') {
      if (Math.random() < 0.05) {
        gainLoss = gainLoss * 3n
        soulProc = true
        gainLossWithoutBonus = gainLossWithoutBonus * 3n
      }
    }

    // Global Event Buffs
    globalBuff = applyGlobalEventBuff(isWin, gainLoss, bet)
    gainLoss = globalBuff.gainLossMultiplied
    globalEchoAmount = globalBuff.echoAmount
    activeGlobalEventType = globalBuff.buffType

    // Mirror event scaling dynamically on the un-bonused track
    if (activeGlobalEventType === 'TIDAL_SURGE') {
      gainLossWithoutBonus = gainLossWithoutBonus + gainLossWithoutBonus / 5n
    } else if (activeGlobalEventType === 'MIRAGE_CATACLYSM') {
      const finalGainRatio =
        Number(gainLoss) /
        Number(globalBuff.gainLossMultiplied - globalEchoAmount || 1n)
      gainLossWithoutBonus =
        (gainLossWithoutBonus * BigInt(Math.round(finalGainRatio * 100))) / 100n
    }

    // Cyclone Blitz streak increment
    if (activeGlobalEventType === 'CYCLONE_BLITZ') {
      streakAfter += 1
    }

    // Final points floor fallback
    const provisionalWithGlobal = currentPoints + gainLoss
    if (provisionalWithGlobal < POINTS_FLOOR) {
      gainLoss = POINTS_FLOOR - currentPoints
    }
    const provisionalWithGlobalWithout = currentPoints + gainLossWithoutBonus
    if (provisionalWithGlobalWithout < POINTS_FLOOR) {
      gainLossWithoutBonus = POINTS_FLOOR - currentPoints
    }

    // Compounded visual bonus display amount (Realized Delta)
    if (effectiveBonus) {
      bonusDisplayAmount = gainLoss - gainLossWithoutBonus
    }
  } else {
    // Loss flow uses defensive modifiers instead of win multipliers
    const safeguardActive = activeFestival?.type === 'SAFEGUARD'
    const conductiveReduction =
      equippedRelic === 'conductive_filament' ? 95n : 100n
    const effectiveBase = safeguardActive ? (bet * 40n) / 100n : baseChange
    const effectiveBaseWithRelic = (effectiveBase * conductiveReduction) / 100n
    const savedAmount = effectiveBonus
      ? (effectiveBaseWithRelic * bonusMultScale) / 100n
      : 0n
    gainLoss = -(effectiveBaseWithRelic - savedAmount)

    if (effectiveBonus) {
      bonusDisplayAmount = savedAmount
    }

    // Fallback points floor check for losses
    const provisionalWithGlobal = currentPoints + gainLoss
    if (provisionalWithGlobal < POINTS_FLOOR) {
      gainLoss = POINTS_FLOOR - currentPoints
    }
  }

  const triggerFlareInfernoCombo =
    isWin && activeGlobalEventType === 'SOLAR_FLARE' && streakAfter >= 5
  const triggerMirageHighEcho =
    isWin &&
    activeGlobalEventType === 'MIRAGE_CATACLYSM' &&
    (globalBuff?.echoFactor ?? 0) >= 45
  const triggerFlashPlusGlobalWin =
    isWin && flashActive && !!activeGlobalEventType
  const triggerDryMirage =
    isWin &&
    activeGlobalEventType === 'MIRAGE_CATACLYSM' &&
    (globalBuff?.echoFactor ?? 0) === 15
  const triggerEyeOfStorm =
    !isWin && activeGlobalEventType === 'CYCLONE_BLITZ' && streakShielded
  const triggerPrismaticWave =
    isWin &&
    activeGlobalEventType === 'TIDAL_SURGE' &&
    equippedRelic === 'prismatic_shard'
  const triggerThermalFusion =
    isWin && activeGlobalEventType === 'SOLAR_FLARE' && soulProc
  const streakDuringTidal =
    isWin && activeGlobalEventType === 'TIDAL_SURGE' ? streakAfter : 0
  const streakDuringCyclone =
    isWin && activeGlobalEventType === 'CYCLONE_BLITZ' ? streakAfter : 0

  let finalCombinedMult = Math.round(
    streakNum * flashMult * (effectiveBonus ? effectiveBonus.multiplier : 1)
  )
  const festivalType = activeFestival?.type ?? null
  const festivalMultValue = isWin && festivalType === 'SURGE' ? 3 : 1

  if (isWin) {
    if (activeFestival?.type === 'SURGE') finalCombinedMult *= 3
    if (kineticFired) finalCombinedMult *= 2
    if (soulProc) finalCombinedMult *= 3
    if (isSolarFlareActive) finalCombinedMult *= 2
  }

  const savedFlashType = flashJustEndedFlag ? null : flashEventType

  return {
    row,
    isWin,
    result,
    oracleRigged,
    defiedOracle,
    currentPoints,
    bet,
    currentPity,
    isNaturalPityHit,
    equippedRelic,
    betAgainstOracle,
    flashEventType,
    flashActive,
    snapshotRelic,
    flashMult,
    flashJustEndedFlag,
    savedFlashType,
    effectiveBonus,
    cycleCounter,
    logicGateFired,
    kineticFired,
    streakShielded,
    streakAfter,
    streakMult,
    streakNum,
    gainLoss,
    bonusDisplayAmount,
    ghostEchoAmount,
    preKineticAmount,
    preSoulAmount,
    soulProc,
    globalBuff,
    globalEchoAmount,
    activeGlobalEventType,
    finalCombinedMult,
    festivalType,
    festivalMultValue,
    isSolarFlareActive,
    triggerFlareInfernoCombo,
    triggerMirageHighEcho,
    triggerFlashPlusGlobalWin,
    triggerDryMirage,
    triggerEyeOfStorm,
    triggerPrismaticWave,
    triggerThermalFusion,
    streakDuringTidal,
    streakDuringCyclone,
    activeFestivalExists: activeFestival !== null,
    resonanceActive
  }
}

// Persists the prediction resolution and updated user state atomically
const persistPredictionResolution = async (
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

  // Consume the Oracle charge atomically with the resolution
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

// Checks and persists newly earned achievements within the open transaction
const processAchievements = async (
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

// Resolves one bettor's prediction across pre-transaction, transaction, and post-commit phases
const resolveUserPrediction = async (
  row: PredictionRow,
  gameId: string,
  winnerName: string,
  isAutobet: boolean,
  broadcast: (event: string, data: string) => void
): Promise<void> => {
  // Phase 1: pre-transaction

  // Determine oracle flags before opening the transaction
  const oracleUsed = await hasUserUsedOracle(row.user_id)
  let oracleRigged = false
  let defiedOracle = false
  if (!oracleUsed) {
    const oracleState = getOracleState()
    const oracleWinnerName =
      oracleState.side === 'left' ? row.player_a_name : row.player_b_name
    if (row.pick === oracleWinnerName) {
      oracleRigged = true
    } else {
      defiedOracle = true
    }
  }

  // Consume before resolution so flashJustEndedFlag reflects the final flash state
  // Snapshot first so the event can be restored if the transaction rolls back
  const rawFlash = getFlashEventForUser(row.user_id)
  const flashEventSnapshot = rawFlash ? { ...rawFlash } : null
  let flashJustEndedFlag = false
  let flashConsumed = false

  if (flashEventSnapshot) {
    const activeFestival = getActiveFestival()
    const willWin =
      oracleRigged ||
      (!defiedOracle &&
        (activeFestival?.type === 'SANGUINE' ||
          !!flashEventSnapshot ||
          row.pick === winnerName))
    if (willWin) {
      flashJustEndedFlag = consumeFlashBetForUser(row.user_id)
      flashConsumed = true
    }
  }

  const ctx = calculatePredictionResolution(
    row,
    winnerName,
    oracleRigged,
    defiedOracle,
    flashJustEndedFlag,
    flashEventSnapshot
  )

  // Phase 2: atomic transaction
  let freshUser: Record<string, unknown>
  let newAchievements: AchievementEntry[]
  let autoEquipBadges = false

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Persist the resolution state and Oracle charge atomically
    freshUser = await persistPredictionResolution(client, ctx)

    const achieved = await processAchievements(client, ctx, freshUser)
    newAchievements = achieved.newAchievements
    autoEquipBadges = achieved.autoEquipBadges

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    // Restore the flash event consumed before the transaction if the resolution fails
    if (flashConsumed) {
      restoreFlashEventForUser(row.user_id, flashEventSnapshot)
    }
    throw err
  } finally {
    client.release()
  }

  // Phase 3: post-commit
  if (ctx.savedFlashType) {
    recordSessionFlashType(row.user_id, ctx.savedFlashType)
  }

  for (const achievement of newAchievements) {
    broadcast(
      'achievement_unlocked',
      JSON.stringify({
        userId: row.user_id,
        nickname: row.nickname ?? 'Anonymous',
        code: achievement.code,
        name: achievement.name,
        icon: achievement.icon,
        rarity: achievement.rarity,
        category: achievement.category,
        requirement: achievement.requirement
      })
    )
    // Safeguard Festival: Mythical achievement (100%) or Legendary (50%)
    if (achievement.rarity === 'MYTHICAL') {
      triggerSafeguardFestival(
        row.nickname ?? 'Anonymous',
        row.user_id,
        broadcast
      )
    } else if (achievement.rarity === 'LEGENDARY' && Math.random() < 0.5) {
      triggerSafeguardFestival(
        row.nickname ?? 'Anonymous',
        row.user_id,
        broadcast
      )
    }
  }

  if (autoEquipBadges) {
    await autoEquipUserBadges(row.user_id)
  }

  // Relic drop runs post-commit so a drop failure cannot roll back the prediction resolution
  const relicsArrayRes = await pool.query<{ equipped_relics: string[] | null }>(
    'SELECT equipped_relics FROM users WHERE user_id = $1',
    [row.user_id]
  )
  const allEquippedKeys: string[] =
    relicsArrayRes.rows[0]?.equipped_relics?.filter(Boolean) ?? []
  const droppedRelic = await rollRelicDrop(
    row.user_id,
    allEquippedKeys,
    Number(freshUser.laps)
  )

  if (droppedRelic?.rarity === 'MYTHICAL') {
    triggerVaultFestival(row.nickname ?? 'Anonymous', row.user_id, broadcast)
  }

  // prediction_result is only emitted after successful COMMIT
  broadcast(
    'prediction_result',
    JSON.stringify({
      userId: row.user_id,
      nickname: row.nickname,
      result: ctx.result,
      gameId,
      amount:
        ctx.gainLoss > 0n
          ? ctx.gainLoss.toString()
          : (-ctx.gainLoss).toString(),
      bonus: ctx.effectiveBonus
        ? {
            amount:
              ctx.bonusDisplayAmount > 0n
                ? ctx.bonusDisplayAmount.toString()
                : '0',
            tier: ctx.effectiveBonus.tier,
            visualMultiplier: Math.floor(ctx.effectiveBonus.multiplier * 100)
          }
        : null,
      wasAllIn: ctx.bet === ctx.currentPoints,
      streakAfter: ctx.streakAfter,
      streakMult: ctx.streakNum,
      flashEventType: ctx.savedFlashType,
      flashMult: ctx.flashJustEndedFlag ? 1 : ctx.flashMult,
      oracleRigged: ctx.oracleRigged,
      globalEventType: ctx.activeGlobalEventType,
      globalEchoAmount:
        ctx.globalEchoAmount > 0n ? ctx.globalEchoAmount.toString() : null,
      ghostEchoAmount:
        ctx.ghostEchoAmount > 0n ? ctx.ghostEchoAmount.toString() : null,
      relicCounter: ctx.cycleCounter,
      relicDrop: droppedRelic ?? null,
      soulProc: ctx.soulProc,
      kineticFired: ctx.kineticFired,
      preSoulAmount: ctx.soulProc
        ? ctx.preSoulAmount.toString()
        : ctx.kineticFired
          ? ctx.preKineticAmount.toString()
          : null
    })
  )

  const activeGlobalEvent = getActiveGlobalEvent()
  const activeFestival = getActiveFestival()
  const isGlobalEventActive =
    activeGlobalEvent && activeGlobalEvent.phase === 'active'
  const isFestivalActive = !!activeFestival

  if (!isAutobet && !isGlobalEventActive && !isFestivalActive) {
    try {
      const existingSession = await getActiveSession(row.user_id)
      if (!existingSession) {
        const stageType = rollBonusTrigger()
        if (stageType) {
          const session = await createSession(row.user_id, ctx.bet, stageType)
          broadcast(
            'bonus_stage_triggered',
            JSON.stringify({
              type: 'bonus_stage_triggered',
              userId: row.user_id,
              sessionId: session.id,
              stageType: session.stageType,
              session: {
                id: session.id,
                stageType: session.stageType,
                accumulatedPayout: session.accumulatedPayout.toString(),
                lastBetAmount: session.lastBetAmount.toString(),
                stageStepsCompleted: session.stageStepsCompleted,
                maxSteps: session.maxSteps,
                gridState: null
              },
              initialData: getClientInitialData(session)
            })
          )
        }
      }
    } catch (err) {
      logger.error('bonusStage trigger error', err, { userId: row.user_id })
    }
  }

  tryTriggerFlashEventForUser(row.user_id, broadcast)

  // Festival trigger runs after flash trigger to avoid double-lockout race
  checkAndTriggerFestival(
    row.user_id,
    row.nickname ?? 'Anonymous',
    {
      isWin: ctx.isWin,
      bonusTier: ctx.effectiveBonus?.tier ?? null,
      bonusMult: ctx.effectiveBonus?.multiplier ?? 1,
      flashActive: ctx.flashActive,
      flashJustEnded: ctx.flashJustEndedFlag,
      winStreakAfter: ctx.streakAfter,
      totalMultiplier: ctx.finalCombinedMult,
      flashType: ctx.flashEventType
    },
    broadcast
  )
}

const resolveWorldBossPrediction = async (
  gameId: string,
  winnerName: string,
  broadcast: (event: string, data: string) => void
): Promise<void> => {
  let predictions
  try {
    predictions = await pool.query(
      `SELECT p.user_id, p.pick, u.nickname, u.equipped_relics
        FROM predictions p
        JOIN users u ON p.user_id = u.user_id
        WHERE p.game_id = $1 AND p.result IS NULL`,
      [gameId]
    )
  } catch (err) {
    logger.error('resolveWorldBossPrediction: fetch failed', err, { gameId })
    return
  }

  const bossState = getBossState()
  const now = Date.now()
  const timeRemaining = bossState.encounterEndsAt
    ? Math.max(0, Math.ceil((bossState.encounterEndsAt - now) / 1000))
    : 0

  await Promise.all(
    predictions.rows.map(async (row) => {
      try {
        const isWin = row.pick === winnerName
        const relics: string[] = row.equipped_relics?.filter(Boolean) ?? []

        registerParticipant(
          row.user_id,
          timeRemaining,
          row.nickname ?? 'Player'
        )

        if (!isWin) {
          recordMiss(row.user_id)
        }

        let damage = 0
        if (isWin) {
          damage = 1
          // Temporal Charge: first 10s registers as 2 damage
          if (
            relics.includes('temporal_charge') &&
            bossState.encounterStartedAt &&
            now - bossState.encounterStartedAt < 10_000
          )
            damage = 2
          // Omega Shard: 10% chance for 3 damage
          if (relics.includes('omega_shard') && Math.random() < 0.1) damage = 3

          applyDamage(row.user_id, damage, broadcast)
        }
        // Phantom Reach: misses still contribute 1 damage (50% proc)
        else if (relics.includes('phantom_reach') && Math.random() < 0.5) {
          applyDamage(row.user_id, 1, broadcast)
          damage = 1 // for SSE reporting
        } else {
          applyDamage(row.user_id, 0, broadcast)
        }

        await pool.query(
          `UPDATE predictions SET result = $1, gain_loss = 0 WHERE user_id = $2 AND game_id = $3`,
          [isWin ? 'WIN' : 'LOSE', row.user_id, gameId]
        )

        const fresh = getBossState()
        const hpPct = fresh.hpPct
        broadcast(
          'world_boss_hit',
          JSON.stringify({
            userId: row.user_id,
            result: isWin ? 'HIT' : 'MISS',
            bossHpPct: hpPct,
            damage
          })
        )
      } catch (err) {
        logger.error('resolveWorldBossPrediction: per-user error', err, {
          userId: row.user_id,
          gameId
        })
      }
    })
  )
}

export const resolvePrediction = async (
  gameId: string,
  winnerName: string,
  broadcast: (event: string, data: string) => void,
  isAutobet = false
): Promise<void> => {
  if (isWorldBossActive()) {
    return resolveWorldBossPrediction(gameId, winnerName, broadcast)
  }

  let rows: PredictionRow[]
  try {
    rows = await fetchPendingPredictions(gameId)
  } catch (err) {
    logger.error('resolvePrediction: failed to fetch predictions', err, {
      gameId
    })
    return
  }

  // Resolve bettors concurrently and independently so one transaction failure does not affect other bettors
  await Promise.all(
    rows.map(async (row) => {
      try {
        await resolveUserPrediction(
          row,
          gameId,
          winnerName,
          isAutobet,
          broadcast
        )
      } catch (err) {
        logger.errorWithPoints('resolvePrediction: failed for user', err, {
          userId: row.user_id,
          gameId,
          points: BigInt(row.current_points),
          betAmount: BigInt(row.bet_amount)
        })
      }
    })
  )
}

export const getPaginatedUserPredictions = async (
  userId: string,
  page: number,
  limit: number,
  sort: 'recent' | 'wins' | 'multipliers' = 'recent'
) => {
  const offset = (page - 1) * limit
  let dataQuery: string
  let countQuery: string
  const baseParams = [userId, limit, offset]
  const countParams = [userId]

  const pCols = `
    p.id, p.game_id AS "gameId", p.pick, p.bet_amount AS "betAmount",
    p.gain_loss AS "gainLoss", p.result, p.bonus_tier AS "bonusTier",
    p.bonus_multiplier AS "bonusMultiplier", p.flash_event_type AS "flashEventType",
    p.flash_multiplier AS "flashMult", p.streak_multiplier AS "streakMultiplier",
    p.created_at AS "createdAt", p.relic_multiplier AS "relicMultiplier",
    p.total_multiplier AS "totalMultiplier",
    p.festival_multiplier AS "festivalMultiplier",
    p.festival_type AS "festivalType",
    p.global_event_type AS "globalEventType",
    p.global_echo_amount AS "globalEchoAmount"`

  if (sort === 'wins') {
    dataQuery = `
      SELECT ${pCols}, m.player_a_name, m.player_a_played, m.player_b_name, m.player_b_played, m.time, m.type
      FROM predictions p
      LEFT JOIN matches m ON p.game_id = m.game_id
      WHERE p.user_id = $1 AND p.result = 'WIN'
      ORDER BY p.gain_loss DESC
      LIMIT $2 OFFSET $3`
    countQuery = `SELECT COUNT(*) FROM predictions WHERE user_id = $1 AND result = 'WIN'`
  } else if (sort === 'multipliers') {
    dataQuery = `
      SELECT ${pCols}, m.player_a_name, m.player_a_played, m.player_b_name, m.player_b_played, m.time, m.type
      FROM predictions p
      LEFT JOIN matches m ON p.game_id = m.game_id
      WHERE p.user_id = $1 AND p.result = 'WIN' AND (p.bonus_multiplier > 0 OR p.flash_multiplier > 1 OR p.festival_multiplier > 1)
      ORDER BY p.total_multiplier DESC
      LIMIT $2 OFFSET $3`
    countQuery = `SELECT COUNT(*) FROM predictions WHERE user_id = $1 AND result = 'WIN' AND (bonus_multiplier > 0 OR flash_multiplier > 1 OR festival_multiplier > 1)`
  } else {
    dataQuery = `
      SELECT ${pCols}, m.player_a_name, m.player_a_played, m.player_b_name, m.player_b_played, m.time, m.type
      FROM predictions p
      LEFT JOIN matches m ON p.game_id = m.game_id
      WHERE p.user_id = $1 AND p.result IS NOT NULL
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3`
    countQuery = `SELECT COUNT(*) FROM predictions WHERE user_id = $1 AND result IS NOT NULL`
  }

  const [data, count] = await Promise.all([
    pool.query(dataQuery, baseParams),
    pool.query(countQuery, countParams)
  ])

  const total = Number(count.rows[0].count)

  const matches = data.rows.map((row) => ({
    gameId: row.gameId,
    time: Number(row.time),
    type: row.type || 'GAME_RESULT',
    playerA: {
      name: row.player_a_name || 'Unknown',
      played: row.player_a_played || 'ROCK'
    },
    playerB: {
      name: row.player_b_name || 'Unknown',
      played: row.player_b_played || 'SCISSORS'
    }
  }))

  const predictions = data.rows.map((row) => ({
    id: row.id,
    gameId: row.gameId,
    pick: row.pick,
    betAmount: row.betAmount?.toString() ?? '0',
    gainLoss: row.gainLoss?.toString() ?? '0',
    result: row.result,
    bonusTier: row.bonusTier ?? null,
    bonusMultiplier: Number(row.bonusMultiplier ?? 0),
    flashEventType: row.flashEventType ?? null,
    flashMult: Number(row.flashMult ?? 1),
    streakMultiplier: Number(row.streakMultiplier ?? 1),
    createdAt: Number(row.createdAt),
    relicMultiplier: Number(row.relicMultiplier ?? 1),
    totalMultiplier: Number(row.totalMultiplier || row.total_multiplier || 1),
    festivalMultiplier: Number(row.festivalMultiplier || 1),
    festivalType: row.festivalType || null,
    globalEventType: row.globalEventType ?? null,
    globalEchoAmount: row.globalEchoAmount
      ? row.globalEchoAmount.toString()
      : null
  }))

  return { matches, predictions, total, hasMore: offset + limit < total }
}

export const getUserStats = async (userId: string, shortId: string) => {
  await getOrCreateUser(userId, shortId)

  const result = await pool.query(
    `SELECT
        u.points,
        u.peak_points,
        u.daily_peak,
        u.weekly_peak,
        u.total_volume,
        u.biggest_win,
        u.current_win_streak,
        u.max_win_streak,
        u.bonus_pity_count,
        u.total_pities_earned,
        u.joined_date,
        u.wins,
        u.losses,
        COALESCE(p_stats.total_gain, 0) as total_gain
      FROM users u
      LEFT JOIN (
        SELECT
            user_id,
            SUM(gain_loss) FILTER (WHERE gain_loss > 0) AS total_gain
        FROM predictions
        WHERE result IS NOT NULL
        GROUP BY user_id
      ) p_stats ON u.user_id = p_stats.user_id
      WHERE u.user_id = $1`,
    [userId]
  )

  const row = result.rows[0]

  if (!row) {
    return {
      total: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      totalGain: '0',
      points: '200000',
      peakPoints: '200000',
      dailyPeak: '100000',
      weeklyPeak: '100000',
      totalVolume: '0',
      biggestWin: '0',
      currentWinStreak: 0,
      maxWinStreak: 0,
      bonusPityCount: 0,
      totalPitiesEarned: 0,
      joinedDate: Date.now().toString(),
      avgReturn: '0'
    }
  }

  const wins = Number(row.wins || 0)
  const losses = Number(row.losses || 0)
  const total = wins + losses
  const totalGain = row.total_gain.toString()

  return {
    total,
    wins,
    losses,
    winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
    totalGain,
    points: row.points.toString(),
    peakPoints: row.peak_points.toString(),
    dailyPeak: row.daily_peak.toString(),
    weeklyPeak: row.weekly_peak.toString(),
    totalVolume: row.total_volume.toString(),
    biggestWin: row.biggest_win.toString(),
    currentWinStreak: Number(row.current_win_streak),
    maxWinStreak: Number(row.max_win_streak),
    bonusPityCount: Number(row.bonus_pity_count),
    totalPitiesEarned: Number(row.total_pities_earned || 0),
    joinedDate: row.joined_date.toString(),
    avgReturn: total > 0 ? (BigInt(totalGain) / BigInt(total)).toString() : '0'
  }
}

export const getGlobalBettingStats = async () => {
  const result = await pool.query(
    `SELECT
        COUNT(*) AS total_bets,
        COALESCE(SUM(bet_amount), 0) AS total_volume,
        COUNT(*) FILTER (WHERE result = 'WIN') AS winning_bets
      FROM predictions`
  )
  const row = result.rows[0]
  return {
    total_bets: Number(row.total_bets),
    total_volume: row.total_volume.toString(),
    winning_bets: Number(row.winning_bets)
  }
}
