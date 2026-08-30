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

export interface BonusSession {
  id: string
  userId: string
  stageType: StageType
  isActive: boolean
  accumulatedPayout: bigint
  lastBetAmount: bigint
  stageStepsCompleted: number
  maxSteps: number | null
  verificationSalt: string
  gridState: unknown | null
  createdAt: Date
  updatedAt: Date
}

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

export interface KingsVaultGrid {
  positions: ('BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND' | 'ROYAL')[]
  chosenIndex: number | null
}

export interface SniperSession {
  startTimestamp: number
  sweepDurationMs: number
  fired: boolean
  resolvedZone?: string
}

export interface OracleVisionSession {
  sequences: number[][]
  currentSequenceIndex: number
  failed: boolean
  complete: boolean
}

export interface RainbowRushSession {
  spinResults: (1 | 2 | 3 | 4 | 5)[]
  spinsRevealed: number
}

export interface RainbowRushWeights {
  tier: 1 | 2 | 3 | 4 | 5
  weight: number
}

export interface WildPredictionGrid {
  cardValues: (0 | 1 | 2 | 3)[]
  flipsRevealed: number
  flippedIndices: number[]
}

export interface TreasureVaultGrid {
  rewards: [number, number, number]
  chosen: number | null
}

export interface SurgeFrenzyGrid {
  confirmedCombo: number
}
