import type { StageType, CrystalTileType, RainbowRushWeights } from "../types/bonusStage.js"

export const STAGE_WEIGHTS: Record<StageType, number> = {
  TREASURE_VAULT: 1.0,
  DOUBLE_DOWN: 1.0,
  WILD_PREDICTION: 1.0,
  SURGE_FRENZY: 1.0,
  RAINBOW_RUSH: 1.0,
  SNIPER_CHALLENGE: 1.0,
  KINGS_VAULT: 1.0,
  ORACLE_VISION: 0.5,
  CRYSTAL_MINE: 1.0
}

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

export const TOTAL_TRIGGER_CHANCE = 3.0

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

export const RAINBOW_RUSH_WEIGHTS: RainbowRushWeights[] = [
  { tier: 1, weight: 30 },
  { tier: 2, weight: 28 },
  { tier: 3, weight: 22 },
  { tier: 4, weight: 13 },
  { tier: 5, weight: 7 }
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
