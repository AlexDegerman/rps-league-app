import pool from '../../utils/db.js'
import { logger } from '../../utils/logger.js'
import {
  getFlashEventForUser,
  consumeFlashBetForUser,
  restoreFlashEventForUser,
  tryTriggerFlashEventForUser,
  recordSessionFlashType
} from '../flashEventService.js'
import { getOracleState, hasUserUsedOracle } from '../oracleProphecyService.js'
import {
  checkAndTriggerFestival,
  getActiveFestival,
  triggerVaultFestival,
  triggerSafeguardFestival
} from '../festivalService.js'
import { getActiveGlobalEvent } from '../globalEventService.js'
import { autoEquipUserBadges } from '../../utils/badgeHelper.js'
import { rollRelicDrop } from '../relicService.js'
import {
  rollBonusTrigger,
  createSession,
  getActiveSession,
  getClientInitialData
} from '../bonusStageService.js'
import { calculatePredictionResolution } from './predictionCalculator.js'
import { persistPredictionResolution } from './predictionPersistence.js'
import { processAchievements } from './predictionAchievements.js'
import type { PredictionRow, AchievementEntry } from '../../types/prediction.js'

/**
 * Fetches all unresolved predictions for a match with the per-bettor state
 * needed for resolution. Single JOIN avoids N+1 queries per bettor
 */
export const fetchPendingPredictions = async (
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

// Resolves one bettor's prediction across pre-transaction, transaction, and post-commit phases
export const resolveUserPrediction = async (
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
