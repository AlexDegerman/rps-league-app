export type StageType =
  | 'TREASURE_VAULT'
  | 'KINGS_VAULT'
  | 'DOUBLE_DOWN'
  | 'WILD_PREDICTION'
  | 'SURGE_FRENZY'
  | 'RAINBOW_RUSH'
  | 'SNIPER_CHALLENGE'
  | 'ORACLE_VISION'
  | 'CRYSTAL_MINE'

// 1. Crystal Mine
export type CrystalTileType = 'EMPTY' | 'DIAMOND'
export interface CrystalTile {
  type: CrystalTileType
  revealed: boolean
}
export interface CrystalMineGrid {
  tiles: CrystalTile[]
  revealedIndices: number[]
  miningCharges: number
}

// 2. King's Vault
export type KingsVaultTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND' | 'ROYAL'
export interface KingsVaultGrid {
  positions: KingsVaultTier[]
  chosenIndex: number | null
}

// 3. Double Down
export interface DoubleDownGrid {
  terminal: boolean
  won: boolean | null
  lastRoll: 'WIN' | 'LOSS' | null
}

// 4. Wild Prediction
export interface WildPredictionGrid {
  cardValues: (0 | 1 | 2 | 3)[]
  flipsRevealed: number
  flippedIndices: number[]
}

// 5. Surge Frenzy
export interface SurgeFrenzyGrid {
  confirmedCombo: number
  startedAt?: number
  lastTapAt?: number
}

// 6. Rainbow Rush
export interface RainbowRushGrid {
  spinResults: (1 | 2 | 3 | 4 | 5)[]
  spinsRevealed: number
}

// 7. Sniper Challenge
export interface SniperGrid {
  startTimestamp: number
  sweepDurationMs: number
  fired: boolean
  resolvedZone?: 'bullseye' | 'clean' | 'hit' | 'near' | 'miss'
}

// 8. Oracle Vision
export interface OracleVisionGrid {
  sequences: number[][]
  currentSequenceIndex: number
  failed: boolean
  complete: boolean
}

// 9. Treasure Vault
export interface TreasureVaultGrid {
  rewards: [number, number, number]
  chosen: number | null
}

export type GridStateMap =
  | CrystalMineGrid
  | KingsVaultGrid
  | DoubleDownGrid
  | WildPredictionGrid
  | SurgeFrenzyGrid
  | RainbowRushGrid
  | SniperGrid
  | OracleVisionGrid
  | TreasureVaultGrid

export interface BonusStageSession {
  id: string
  stageType: StageType
  accumulatedPayout: string
  lastBetAmount: string
  stageStepsCompleted: number
  maxSteps: number | null
  gridState: GridStateMap | null
}

export interface BonusStageTriggerSSEData {
  sessionId: string
  stageType: StageType
  session: BonusStageSession
  initialData: unknown | null
  reconnect?: boolean
}

export interface BonusStageCompletedSSEData {
  finalPayout: string
  stageType: StageType
}
