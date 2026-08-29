import { getFlashEventForUser } from '../flashEventService.js'
import {
  getActiveFestival,
  getGuaranteedBonusRemaining,
  consumeGuaranteedBonus
} from '../festivalService.js'
import {
  applyGlobalEventBuff,
  getActiveGlobalEvent
} from '../globalEventService.js'
import type {
  PredictionRow,
  ResolutionContext
} from '../../types/prediction.js'

const POINTS_FLOOR = 100000n
// Architect's Keystone upgrades a bonus to MYTHICAL at this multiplier
const MYTHICAL_MULTIPLIER = 7.0
const TIER_UPGRADE: Record<string, string> = {
  COMMON: 'RARE',
  RARE: 'EPIC',
  EPIC: 'LEGENDARY',
  LEGENDARY: 'MYTHICAL'
}

// 40% chance of a bonus (80% under 2M points). Tier determines multiplier range
export const rollBonus = (
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

// Calculates the complete gameplay outcome from the supplied prediction state
export const calculatePredictionResolution = (
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
  let globalBuff = null as ResolutionContext['globalBuff']
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
