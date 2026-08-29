import type { GlobalEventBuffResult } from '../services/globalEventService.js'

export interface PredictionRow {
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
export interface ResolutionContext {
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

export type AchievementEntry = {
  code: string
  name: string
  icon: string
  rarity: string
  category: string
  requirement: string
}
