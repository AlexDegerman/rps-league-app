import pool from '../utils/db.js'
import {
  type StageType,
  type BonusSession,
  ENABLED_STAGES,
  TOTAL_TRIGGER_CHANCE,
  CRYSTAL_TILE_DISTRIBUTION,
  type CrystalMineGrid,
  type KingsVaultGrid,
  type SniperSession,
  type OracleVisionSession,
  type RainbowRushSession,
  type WildPredictionGrid,
  type TreasureVaultGrid,
  type SurgeFrenzyGrid,
  KINGS_VAULT_PAYOUTS,
  DOUBLE_DOWN_PAYOUTS,
  RAINBOW_RUSH_WEIGHTS,
  RAINBOW_RUSH_PAYOUTS,
  ORACLE_VISION_PAYOUTS
} from '../types/bonusStage.js'

export function rollBonusTrigger(): StageType | null {
  if (Math.random() * 100 > TOTAL_TRIGGER_CHANCE) return null

  if (ENABLED_STAGES.length === 0) return null

  const index = Math.floor(Math.random() * ENABLED_STAGES.length)
  return ENABLED_STAGES[index] ?? null
}

export async function createSession(
  userId: string,
  lastBetAmount: bigint,
  stageType: StageType
): Promise<BonusSession> {
  const gridState = generateGridState(stageType)
  const maxSteps = getMaxSteps(stageType)

  const result = await pool.query(
    `INSERT INTO bonus_stage_sessions
        (user_id, stage_type, is_active, accumulated_payout, last_bet_amount,
        stage_steps_completed, max_steps, grid_state)
      VALUES ($1, $2, true, 0, $3, 0, $4, $5)
     RETURNING *`,
    [
      userId,
      stageType,
      lastBetAmount.toString(),
      maxSteps,
      gridState ? JSON.stringify(gridState) : null
    ]
  )
  return rowToSession(result.rows[0])
}

export async function getActiveSession(
  userId: string
): Promise<BonusSession | null> {
  const result = await pool.query(
    `SELECT * FROM bonus_stage_sessions
      WHERE user_id = $1 AND is_active = true
      ORDER BY created_at DESC LIMIT 1`,
    [userId]
  )
  return result.rows[0] ? rowToSession(result.rows[0]) : null
}

export async function countActiveSessions(): Promise<number> {
  const result = await pool.query(
    `SELECT COUNT(*) FROM bonus_stage_sessions WHERE is_active = true`
  )
  return parseInt(result.rows[0].count, 10)
}

// Client Data

export function getClientInitialData(session: BonusSession): unknown {
  switch (session.stageType) {
    case 'ORACLE_VISION': {
      const grid = session.gridState as OracleVisionSession
      return { firstSequence: grid.sequences[0] }
    }
    case 'RAINBOW_RUSH':
      return { totalSpins: 3 }
    case 'SNIPER_CHALLENGE': {
      const grid = session.gridState as SniperSession
      return {
        startTimestamp: grid.startTimestamp,
        sweepDurationMs: grid.sweepDurationMs
      }
    }
    default:
      return null
  }
}

export function getReconnectData(session: BonusSession): unknown {
  switch (session.stageType) {
    case 'ORACLE_VISION': {
      const grid = session.gridState as OracleVisionSession
      if (grid.failed || grid.complete) return { terminal: true }
      return {
        currentSequence: grid.sequences[grid.currentSequenceIndex],
        currentSequenceIndex: grid.currentSequenceIndex
      }
    }
    case 'RAINBOW_RUSH': {
      const grid = session.gridState as RainbowRushSession
      return {
        revealedSpins: grid.spinResults.slice(0, grid.spinsRevealed),
        spinsRevealed: grid.spinsRevealed,
        totalSpins: 3
      }
    }
    case 'CRYSTAL_MINE': {
      const grid = session.gridState as CrystalMineGrid
      return {
        tiles: grid.tiles,
        miningCharges: grid.miningCharges,
        revealedIndices: grid.revealedIndices
      }
    }
    case 'SNIPER_CHALLENGE': {
      const grid = session.gridState as SniperSession
      return {
        fired: grid.fired,
        startTimestamp: grid.startTimestamp,
        sweepDurationMs: grid.sweepDurationMs
      }
    }
    case 'DOUBLE_DOWN': {
      const grid = session.gridState as Record<string, unknown>
      return {
        currentStep: session.stageStepsCompleted,
        terminal: grid?.terminal ?? false,
        lastRoll: grid?.lastRoll ?? null
      }
    }
    case 'WILD_PREDICTION': {
      const grid = session.gridState as WildPredictionGrid
      return {
        flipsRevealed: grid.flipsRevealed,
        cardValues: grid.cardValues
      }
    }
    case 'TREASURE_VAULT': {
      const grid = session.gridState as TreasureVaultGrid
      return {
        rewards: grid.rewards,
        chosen: grid.chosen
      }
    }
    case 'KINGS_VAULT': {
      const grid = session.gridState as KingsVaultGrid
      return {
        positions: grid.positions,
        chosenIndex: grid.chosenIndex
      }
    }
    default:
      return null
  }
}

// Action Dispatcher 

export async function processAction(
  session: BonusSession,
  actionPayload: Record<string, unknown>
): Promise<BonusSession> {
  switch (session.stageType) {
    case 'TREASURE_VAULT':
      return processTreasureVaultPick(session, actionPayload)
    case 'KINGS_VAULT':
      return processKingsVaultPick(session, actionPayload)
    case 'DOUBLE_DOWN':
      return processDoubleDown(session, actionPayload)
    case 'WILD_PREDICTION':
      return processWildPrediction(session, actionPayload)
    case 'SURGE_FRENZY':
      return processSurgeFrenzyAction(session, actionPayload)
    case 'RAINBOW_RUSH':
      return processRainbowRushSpin(session, actionPayload)
    case 'SNIPER_CHALLENGE':
      return processSniperAction(session, actionPayload)
    case 'ORACLE_VISION':
      return processOracleVisionInput(session, actionPayload)
    case 'CRYSTAL_MINE':
      return processCrystalMineTap(session, actionPayload)
    default:
      throw new Error(`Unknown stage type: ${session.stageType}`)
  }
}

// Stage Handlers

async function processTreasureVaultPick(
  session: BonusSession,
  payload: Record<string, unknown>
): Promise<BonusSession> {
  const grid = session.gridState as TreasureVaultGrid
  if (grid.chosen !== null) throw new Error('Chest already chosen')

  const chestIndex = payload.chestIndex as number
  if (chestIndex < 0 || chestIndex > 2) throw new Error('Invalid chest index')

  const multiplier = grid.rewards[chestIndex]
  if (multiplier === undefined) {
    throw new Error('Reward not found for the selected chest')
  }

  const payout = session.lastBetAmount * BigInt(multiplier)
  return updateSession(session.id, {
    accumulatedPayout: payout,
    stageStepsCompleted: 1,
    gridState: { ...grid, chosen: chestIndex }
  })
}

async function processKingsVaultPick(
  session: BonusSession,
  payload: Record<string, unknown>
): Promise<BonusSession> {
  const grid = session.gridState as KingsVaultGrid
  if (grid.chosenIndex !== null) throw new Error('Chest already chosen')

  const chestIndex = payload.chestIndex as number
  if (chestIndex < 0 || chestIndex > 4) throw new Error('Invalid chest index')

  const tier = grid.positions[chestIndex]
  if (tier === undefined) {
    throw new Error('Selected chest tier is missing')
  }

  const multiplier = KINGS_VAULT_PAYOUTS[tier]
  if (multiplier === undefined) {
    throw new Error('Payout multiplier not found for this tier')
  }

  const payout = session.lastBetAmount * BigInt(multiplier)
  return updateSession(session.id, {
    accumulatedPayout: payout,
    stageStepsCompleted: 1,
    gridState: { ...grid, chosenIndex: chestIndex }
  })
}

async function processDoubleDown(
  session: BonusSession,
  payload: Record<string, unknown>
): Promise<BonusSession> {
  if (payload.action === 'CLAIM') {
    const multiplier = DOUBLE_DOWN_PAYOUTS[session.stageStepsCompleted] ?? 2
    return updateSession(session.id, {
      accumulatedPayout: session.lastBetAmount * BigInt(multiplier)
    })
  }
  const won = Math.random() < 0.5
  const newStep = won
    ? session.stageStepsCompleted + 1
    : session.stageStepsCompleted
  const multiplier = won ? (DOUBLE_DOWN_PAYOUTS[newStep] ?? 10) : 2
  const terminal = !won || newStep >= 3
  return updateSession(session.id, {
    accumulatedPayout: session.lastBetAmount * BigInt(multiplier),
    stageStepsCompleted: newStep,
    gridState: { terminal, won, lastRoll: won ? 'WIN' : 'LOSS' }
  })
}

async function processWildPrediction(
  session: BonusSession,
  payload: Record<string, unknown>
): Promise<BonusSession> {
  const grid = session.gridState as WildPredictionGrid

  if (grid.flipsRevealed >= 3) {
    throw new Error('All cards already flipped')
  }

  const flipIndex = Number(payload.flipIndex)

  if (!Number.isInteger(flipIndex) || flipIndex < 0 || flipIndex > 2) {
    throw new Error('Invalid card index')
  }

  const flippedIndices = grid.flippedIndices ?? []

  if (flippedIndices.includes(flipIndex)) {
    throw new Error('Card already flipped')
  }

  const newFlippedIndices = [...flippedIndices, flipIndex]
  const newFlipsRevealed = newFlippedIndices.length

  let payout = 0n

  if (newFlipsRevealed === 3) {
    const total = grid.cardValues.reduce<number>((a, b) => a + b, 0)

    const multiplier =
      total <= 3 ? 2 : total <= 5 ? 4 : total <= 7 ? 6 : total === 8 ? 8 : 10

    payout = session.lastBetAmount * BigInt(multiplier)
  }

  return updateSession(session.id, {
    accumulatedPayout: payout,
    stageStepsCompleted: newFlipsRevealed,
    gridState: {
      ...grid,
      flipsRevealed: newFlipsRevealed,
      flippedIndices: newFlippedIndices
    }
  })
}

async function processSurgeFrenzyAction(
  session: BonusSession,
  payload: Record<string, unknown>
): Promise<BonusSession> {
  const grid = (session.gridState as SurgeFrenzyGrid & {
    startedAt?: number
    lastTapAt?: number
  }) ?? { confirmedCombo: 0 }

  if (payload.action === 'TAP') {
    // Enforce the 5-second frenzy duration server-side
    const now = Date.now()
    const startedAt = grid.startedAt ?? now
    const elapsed = now - startedAt

    if (elapsed > 5000 + 1500) {
      // Allow a 1.5-second grace period for network latency
      throw new Error('Frenzy window has already expired')
    }

    // Enforce a minimum 50ms interval between taps.
    const lastTapAt = grid.lastTapAt ?? 0
    if (now - lastTapAt < 50) {
      throw new Error('Rate limit exceeded: Tap too fast')
    }

    // Prevent the combo from exceeding the expected tap rate.
    const nextCombo = (grid.confirmedCombo ?? 0) + 1
    const maxAllowedCombo = 3 + Math.floor(elapsed / 100)
    if (nextCombo > maxAllowedCombo) {
      throw new Error('Anomalous tap rate detected: Validation failed')
    }

    return updateSession(session.id, {
      gridState: {
        ...grid,
        confirmedCombo: nextCombo,
        startedAt,
        lastTapAt: now
      }
    })
  }
  if (payload.action === 'END') {
    const startedAt = grid.startedAt ?? Date.now()
    const elapsed = Date.now() - startedAt

    let multiplier = 2
    if (elapsed >= 4800) multiplier = 10
    else if (elapsed >= 3800) multiplier = 8
    else if (elapsed >= 2800) multiplier = 6
    else if (elapsed >= 1300) multiplier = 4

    return updateSession(session.id, {
      accumulatedPayout: session.lastBetAmount * BigInt(multiplier),
      stageStepsCompleted: 1
    })
  }
  throw new Error(`Unknown Surge Frenzy action: ${payload.action}`)
}

async function processRainbowRushSpin(
  session: BonusSession,
  _payload: Record<string, unknown>
): Promise<BonusSession> {
  const grid = session.gridState as RainbowRushSession
  if (grid.spinsRevealed >= 3) throw new Error('All spins already revealed')
  const newRevealed = grid.spinsRevealed + 1
  let payout = 0n
  if (newRevealed === 3) {
    const sum = grid.spinResults.reduce((a, b) => a + b, 0)
    const finalSpectrum = Math.floor(sum / 3)
    const multiplier = RAINBOW_RUSH_PAYOUTS[finalSpectrum] ?? 2
    payout = session.lastBetAmount * BigInt(multiplier)
  }
  return updateSession(session.id, {
    accumulatedPayout: payout,
    stageStepsCompleted: newRevealed,
    gridState: { ...grid, spinsRevealed: newRevealed }
  })
}

async function processSniperAction(
  session: BonusSession,
  payload: Record<string, unknown>
): Promise<BonusSession> {
  const grid = session.gridState as SniperSession
  if (payload.action === 'START') {
    if (grid.fired) throw new Error('Already fired')
    return updateSession(session.id, {
      gridState: { ...grid, startTimestamp: Date.now(), sweepDurationMs: 1800 }
    })
  }
  if (payload.action === 'FIRE') {
    if (grid.fired) throw new Error('Already fired')
    const tapMs = payload.tapTimestampMs as number
    const sweepDur = grid.sweepDurationMs || 1800
    const elapsed = tapMs - grid.startTimestamp
    const cyclePosition = (elapsed % sweepDur) / sweepDur
    const crosshairPos = 0.5 + 0.5 * Math.sin(2 * Math.PI * cyclePosition)
    const dist = Math.abs(crosshairPos - 0.5)

    const zones = { bullseye: 0.05, clean: 0.12, hit: 0.22, near: 0.35 }
    const payoutTable = { bullseye: 10, clean: 8, hit: 6, near: 4, miss: 2 }

    let multiplier = payoutTable.miss
    let resolvedZone = 'miss'

    if (dist <= zones.bullseye) {
      multiplier = payoutTable.bullseye
      resolvedZone = 'bullseye'
    } else if (dist <= zones.clean) {
      multiplier = payoutTable.clean
      resolvedZone = 'clean'
    } else if (dist <= zones.hit) {
      multiplier = payoutTable.hit
      resolvedZone = 'hit'
    } else if (dist <= zones.near) {
      multiplier = payoutTable.near
      resolvedZone = 'near'
    }

    return updateSession(session.id, {
      accumulatedPayout: session.lastBetAmount * BigInt(multiplier),
      stageStepsCompleted: 1,
      gridState: {
        ...grid,
        fired: true,
        resolvedZone,
        sweepDurationMs: sweepDur
      }
    })
  }
  throw new Error(`Unknown Sniper action: ${payload.action}`)
}

async function processOracleVisionInput(
  session: BonusSession,
  payload: Record<string, unknown>
): Promise<BonusSession> {
  const grid = session.gridState as OracleVisionSession
  if (grid.failed || grid.complete) throw new Error('Session already terminal')
  const currentSeq = grid.sequences[grid.currentSequenceIndex]
  if (currentSeq === undefined) throw new Error('Current sequence not found')
  const stepWithinSeq = session.stageStepsCompleted % 3
  const correct = payload.glyphIndex === currentSeq[stepWithinSeq]
  if (!correct) {
    const completed = grid.currentSequenceIndex
    const multiplier = ORACLE_VISION_PAYOUTS[completed] ?? 2
    return updateSession(session.id, {
      accumulatedPayout: session.lastBetAmount * BigInt(multiplier),
      stageStepsCompleted: session.stageStepsCompleted + 1,
      gridState: { ...grid, failed: true }
    })
  }
  const newStepWithinSeq = stepWithinSeq + 1
  if (newStepWithinSeq === 3) {
    const newSeqIndex = grid.currentSequenceIndex + 1
    const multiplier = ORACLE_VISION_PAYOUTS[newSeqIndex] ?? 2
    const isComplete = newSeqIndex >= 5
    return updateSession(session.id, {
      accumulatedPayout: session.lastBetAmount * BigInt(multiplier),
      stageStepsCompleted: session.stageStepsCompleted + 1,
      gridState: {
        ...grid,
        currentSequenceIndex: newSeqIndex,
        complete: isComplete
      }
    })
  }
  return updateSession(session.id, {
    stageStepsCompleted: session.stageStepsCompleted + 1,
    gridState: { ...grid }
  })
}

async function processCrystalMineTap(
  session: BonusSession,
  payload: Record<string, unknown>
): Promise<BonusSession> {
  const grid = session.gridState as CrystalMineGrid
  const tileIndex = payload.tileIndex as number
  if (tileIndex < 0 || tileIndex > 24) throw new Error('Invalid tile index')

  const tile = grid.tiles[tileIndex]
  if (tile === undefined) throw new Error('Tile not found')

  if (tile.revealed) throw new Error('Tile already revealed')
  if (grid.miningCharges <= 0) throw new Error('No charges remaining')

  const newCharges = grid.miningCharges - 1
  const newTiles = grid.tiles.map((t, i) =>
    i === tileIndex ? { ...t, revealed: true } : t
  )

  const revealedDiamonds = newTiles.filter(
    (t) => t.revealed && t.type === 'DIAMOND'
  ).length

  const isExhausted = newCharges <= 0

  // Five picks determine the final reward.
  // 0-1 diamonds = 2x, then each additional diamond increases the multiplier.
  let multiplier = 2
  if (revealedDiamonds >= 5) multiplier = 10
  else if (revealedDiamonds === 4) multiplier = 8
  else if (revealedDiamonds === 3) multiplier = 6
  else if (revealedDiamonds === 2) multiplier = 4

  const finalPayout = isExhausted
    ? session.lastBetAmount * BigInt(multiplier)
    : session.accumulatedPayout

  return updateSession(session.id, {
    accumulatedPayout: finalPayout,
    stageStepsCompleted: session.stageStepsCompleted + 1,
    gridState: {
      tiles: newTiles,
      miningCharges: newCharges,
      revealedIndices: [...grid.revealedIndices, tileIndex]
    }
  })
}

//  Claim & Resolve 

export async function claimWinnings(
  session: BonusSession,
  _currentBalance: bigint
): Promise<bigint> {
  const finalPayout = session.accumulatedPayout
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      `UPDATE bonus_stage_sessions
        SET is_active = false, updated_at = NOW()
        WHERE id = $1`,
      [session.id]
    )
    // Build milestone increments based on stage outcome
    const milestoneUpdates: string[] = []

    if (session.stageType === 'CRYSTAL_MINE') {
      const grid = session.gridState as CrystalMineGrid
      const crystalCount = grid.tiles.filter(
        (t) => t.revealed && t.type !== 'EMPTY'
      ).length
      if (crystalCount === 5) {
        milestoneUpdates.push('crystal_mine_clears = crystal_mine_clears + 1')
      }
    }

    if (
      session.stageType === 'DOUBLE_DOWN' &&
      session.stageStepsCompleted >= 3
    ) {
      milestoneUpdates.push(
        'double_down_max_clears = double_down_max_clears + 1'
      )
    }

    if (
      session.stageType === 'ORACLE_VISION' &&
      session.stageStepsCompleted >= 15 // 5 sequences × 3 glyphs each
    ) {
      milestoneUpdates.push(
        'oracle_vision_perfect_clears = oracle_vision_perfect_clears + 1'
      )
    }

    if (session.stageType === 'WILD_PREDICTION') {
      const grid = session.gridState as WildPredictionGrid
      const total = grid.cardValues.reduce<number>((a, b) => a + b, 0)
      if (total >= 9) {
        milestoneUpdates.push(
          'wild_prediction_max_combos = wild_prediction_max_combos + 1'
        )
      }
    }

    if (session.stageType === 'TREASURE_VAULT') {
      const grid = session.gridState as TreasureVaultGrid
      if (
        grid.chosen !== null &&
        grid.rewards[grid.chosen as number] === 10
      ) {
        milestoneUpdates.push(
          'royal_treasure_chests_opened = royal_treasure_chests_opened + 1'
        )
      }
    }

    if (session.stageType === 'KINGS_VAULT') {
      const grid = session.gridState as KingsVaultGrid
      if (
        grid.chosenIndex !== null &&
        grid.positions[grid.chosenIndex as number] === 'ROYAL'
      ) {
        milestoneUpdates.push(
          'royal_kings_chests_found = royal_kings_chests_found + 1'
        )
      }
    }

    if (session.stageType === 'RAINBOW_RUSH') {
      const grid = session.gridState as RainbowRushSession
      const sum = grid.spinResults.reduce((a, b) => a + b, 0)
      if (Math.floor(sum / 3) >= 5) {
        milestoneUpdates.push('rainbow_tier_rolls = rainbow_tier_rolls + 1')
      }
    }

    if (session.stageType === 'SURGE_FRENZY') {
      const grid = session.gridState as SurgeFrenzyGrid
      if ((grid.confirmedCombo ?? 0) >= 5) {
        milestoneUpdates.push(
          'surge_frenzy_max_combo_finishes = surge_frenzy_max_combo_finishes + 1'
        )
      }
    }

    const milestoneClause =
      milestoneUpdates.length > 0 ? ', ' + milestoneUpdates.join(', ') : ''

    await client.query(
      `UPDATE users
        SET points = points + $1,
            bonus_stages_played = bonus_stages_played + 1,
            neon_paradise_minigames_played = COALESCE(neon_paradise_minigames_played, '{}'::jsonb) ||
              jsonb_build_object($3::text,
                COALESCE((neon_paradise_minigames_played->>$3)::int, 0) + 1
              )
            ${milestoneClause}
        WHERE user_id = $2`,
      [finalPayout.toString(), session.userId, session.stageType]
    )
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
  return finalPayout
}

// Private Helpers 

function generateGridState(stageType: StageType): unknown {
  switch (stageType) {
    case 'CRYSTAL_MINE': {
      const tiles = shuffle([...CRYSTAL_TILE_DISTRIBUTION]).map((type) => ({
        type,
        revealed: false
      }))
      return {
        tiles,
        revealedIndices: [],
        miningCharges: 5
      } satisfies CrystalMineGrid
    }
    case 'KINGS_VAULT': {
      const tiers = ['BRONZE', 'SILVER', 'GOLD', 'DIAMOND', 'ROYAL'] as const
      return {
        positions: shuffle([...tiers]),
        chosenIndex: null
      } satisfies KingsVaultGrid
    }
    case 'SNIPER_CHALLENGE':
      return {
        startTimestamp: Date.now(),
        sweepDurationMs: 1800,
        fired: false
      } satisfies SniperSession
    case 'ORACLE_VISION': {
      const sequences = Array.from({ length: 5 }, () =>
        Array.from({ length: 3 }, () => Math.floor(Math.random() * 16))
      )
      return {
        sequences,
        currentSequenceIndex: 0,
        failed: false,
        complete: false
      } satisfies OracleVisionSession
    }
    case 'RAINBOW_RUSH': {
      const spinResults = Array.from({ length: 3 }, rollWeightedSpin)
      return { spinResults, spinsRevealed: 0 } satisfies RainbowRushSession
    }
    case 'WILD_PREDICTION': {
      const cardValues = Array.from({ length: 3 }, () =>
        weightedPick([
          { value: 0 as const, weight: 25 },
          { value: 1 as const, weight: 35 },
          { value: 2 as const, weight: 25 },
          { value: 3 as const, weight: 15 }
        ])
      )
      return {
        cardValues,
        flipsRevealed: 0,
        flippedIndices: []
      } satisfies WildPredictionGrid
    }
    case 'TREASURE_VAULT': {
      const rewards = shuffle([2, 5, 10]) as [number, number, number]
      return { rewards, chosen: null } satisfies TreasureVaultGrid
    }
    case 'SURGE_FRENZY':
      return { confirmedCombo: 0 } satisfies SurgeFrenzyGrid
    case 'DOUBLE_DOWN':
      return { terminal: false, won: null, lastRoll: null }
    default:
      return null
  }
}

function getMaxSteps(stageType: StageType): number | null {
  const map: Partial<Record<StageType, number>> = {
    ORACLE_VISION: 5,
    DOUBLE_DOWN: 3,
    RAINBOW_RUSH: 3,
    WILD_PREDICTION: 3
  }
  return map[stageType] ?? null
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  return arr
}

function rollWeightedSpin(): 1 | 2 | 3 | 4 | 5 {
  const roll = Math.random() * 100
  let cumulative = 0
  for (const { tier, weight } of RAINBOW_RUSH_WEIGHTS) {
    cumulative += weight
    if (roll <= cumulative) return tier
  }
  return 1
}

function weightedPick<T>(options: { value: T; weight: number }[]): T {
  const total = options.reduce((sum, o) => sum + o.weight, 0)
  let roll = Math.random() * total
  for (const { value, weight } of options) {
    roll -= weight
    if (roll <= 0) return value
  }
  return options[options.length - 1]!.value
}

async function updateSession(
  sessionId: string,
  updates: {
    accumulatedPayout?: bigint
    stageStepsCompleted?: number
    gridState?: unknown
  }
): Promise<BonusSession> {
  const sets: string[] = ['updated_at = NOW()']
  const values: unknown[] = []
  let idx = 1
  if (updates.accumulatedPayout !== undefined) {
    sets.push(`accumulated_payout = $${idx++}`)
    values.push(updates.accumulatedPayout.toString())
  }
  if (updates.stageStepsCompleted !== undefined) {
    sets.push(`stage_steps_completed = $${idx++}`)
    values.push(updates.stageStepsCompleted)
  }
  if (updates.gridState !== undefined) {
    sets.push(`grid_state = $${idx++}`)
    values.push(JSON.stringify(updates.gridState))
  }
  values.push(sessionId)
  const result = await pool.query(
    `UPDATE bonus_stage_sessions
      SET ${sets.join(', ')}
      WHERE id = $${idx}
     RETURNING *`,
    values
  )
  return rowToSession(result.rows[0])
}

function rowToSession(row: Record<string, unknown>): BonusSession {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    stageType: row.stage_type as StageType,
    isActive: row.is_active as boolean,
    accumulatedPayout: BigInt(String(row.accumulated_payout ?? '0')),
    lastBetAmount: BigInt(String(row.last_bet_amount ?? '0')),
    stageStepsCompleted: row.stage_steps_completed as number,
    maxSteps: (row.max_steps as number | null) ?? null,
    verificationSalt: row.verification_salt as string,
    gridState: row.grid_state ?? null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string)
  }
}
