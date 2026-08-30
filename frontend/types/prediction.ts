import { GlobalEventType } from './events'

export type BonusTier = 'MYTHICAL' | 'LEGENDARY' | 'EPIC' | 'RARE' | 'COMMON'

export interface PredictionRecord {
  gameId: string
  pick: string
  result?: 'WIN' | 'LOSE'
  confirmed: boolean
  id?: number
  betAmount?: string
  gainLoss?: string
  bonusTier?: string | null
  bonusMultiplier?: number
  createdAt?: number
  flashEventType?: string | null
  flashMult?: number
  streakMultiplier?: number
  relicMultiplier?: number
  totalMultiplier: number
  festivalMultiplier?: number
  festivalType?: string | null
  globalEventType?: string | null
  globalEchoAmount?: string | null
}

export interface BetHistoryEntry {
  id: number
  gameId: string
  pick: string
  result: 'WIN' | 'LOSE' | null
  createdAt: number
  betAmount: string
  gainLoss: string
  bonusTier: string | null
  bonusMultiplier: number
  playerAName: string
  playerBName: string
  playerAPlayed: 'ROCK' | 'PAPER' | 'SCISSORS'
  playerBPlayed: 'ROCK' | 'PAPER' | 'SCISSORS'
  flashMult: number
  flashEventType: string | null
  streakMult: number
  relicMultiplier: number
  totalMultiplier: number
  festivalMultiplier: number
  festivalType: string | null
  globalEventType: string | null
  globalEchoAmount: string | null
}

export interface PredictionResponse {
  success: boolean
  gameId: string
  userId: string
  pointsAfter: string
  error?: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface PublicProfile {
  nickname: string
  shortId: string
  stats: import('./user').UserStats
  recentHistory: {
    gameId: string
    pick: string
    result: 'WIN' | 'LOSE'
    betAmount: string
    gain: string
  }[]
}

export interface BonusData {
  tier: BonusTier
  amount: bigint
  multiplier?: number
  visualMultiplier?: number
}

export interface BonusStyle {
  label: string
  color: string
  bg: string
  cardClass: string
  auraClass?: string
  amountColor?: string
}

export type ConfettiType =
  | 'normal'
  | 'hellfire'
  | 'lunar'
  | 'electric'
  | 'cards'
  | 'fever'
  | 'inferno'
  | 'tidal_surge'
  | 'solar_flare'
  | 'cyclone_blitz'
  | 'mirage_cataclysm'

export interface ResultAnim {
  win: boolean
  amount: bigint
  bonus?: BonusData | null
  confetti?: { vx: number; vy: number; leftOffset: number; delay: number }[]
  streakAfter?: number
  confettiType?: ConfettiType
  flashMult?: number
  flashEventType?: string | null
  ghostEchoAmount?: bigint | null
  soulProc?: boolean
  kineticFired?: boolean
  preSoulAmount?: bigint
  globalEventType?: GlobalEventType | null
  globalEchoAmount?: bigint | null
}

export interface PredictionResultSSEData {
  userId: string
  gameId: string
  result: 'WIN' | 'LOSE'
  amount: string
  nickname?: string
  streakAfter?: number
  streakMult?: number
  bonus?: { tier: BonusTier; amount: string; multiplier?: number } | null
  flashMult?: number
  flashEventType?: string | null
  relicDrop?: unknown
  relicCounter?: number
  soulProc?: boolean
  kineticFired?: boolean
  preSoulAmount?: string
  ghostEchoAmount?: string
  globalEventType?: GlobalEventType | null
  globalEchoAmount?: string | null
}