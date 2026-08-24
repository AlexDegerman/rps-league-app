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

export const ENABLED_STAGES: StageType[] = [
  'TREASURE_VAULT',
  'DOUBLE_DOWN',
  'WILD_PREDICTION',
  'SURGE_FRENZY',
  'RAINBOW_RUSH',
  'SNIPER_CHALLENGE',
  'KINGS_VAULT',
  'ORACLE_VISION',
  'CRYSTAL_MINE'
]

export const TOTAL_TRIGGER_CHANCE = 2.0

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

export interface CrystalMineGrid {
  tiles: CrystalTile[]
  revealedIndices: number[]
  miningCharges: number
}

export type CrystalTileType = 'EMPTY' | 'DIAMOND'

export interface CrystalTile {
  type: CrystalTileType
  revealed: boolean
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

export const KINGS_VAULT_PAYOUTS: Record<string, number> = {
  BRONZE: 2,
  SILVER: 4,
  GOLD: 6,
  DIAMOND: 8,
  ROYAL: 10
}

export const DOUBLE_DOWN_PAYOUTS: Record<number, number> = {
  0: 2,
  1: 4,
  2: 6,
  3: 10
}

export const CRYSTAL_TILE_DISTRIBUTION: CrystalTileType[] = [
  ...Array(7).fill('EMPTY'),
  ...Array(18).fill('DIAMOND')
]

export const RAINBOW_RUSH_WEIGHTS = [
  { tier: 1 as const, weight: 30 },
  { tier: 2 as const, weight: 28 },
  { tier: 3 as const, weight: 22 },
  { tier: 4 as const, weight: 13 },
  { tier: 5 as const, weight: 7 }
]

export const RAINBOW_RUSH_PAYOUTS: Record<number, number> = {
  1: 2,
  2: 4,
  3: 6,
  4: 8,
  5: 10
}

export const SURGE_FRENZY_COMBO_PAYOUTS: Record<number, number> = {
  1: 2,
  2: 4,
  3: 6,
  4: 8
}

export const SURGE_FRENZY_MAX_COMBO_PAYOUT = 10

export const ORACLE_VISION_PAYOUTS: Record<number, number> = {
  0: 2,
  1: 2,
  2: 4,
  3: 6,
  4: 8,
  5: 10
}
