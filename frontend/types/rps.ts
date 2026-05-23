export type Move = 'ROCK' | 'PAPER' | 'SCISSORS'

export interface Player {
  name: string
  played: Move
}

export interface Match {
  type: string
  gameId: string
  time: number
  playerA: Player
  playerB: Player
}

export interface PlayerStats {
  name: string
  wins: number
  losses: number
  winRate: number
}

export interface SinglePlayerStats {
  total: number
  wins: number
  losses: number
  winRate: number
}

export interface PendingMatch {
  gameId: string
  time: number
  expiresAt: number
  playerA: string
  playerB: string
}

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
}
export interface UserStats {
  joinedDate: string
  total: number
  wins: number
  losses: number
  winRate: number
  points: string
  totalGain: string
  totalVolume: string
  biggestWin: string
  avgReturn: string
  peakPoints: string
  dailyPeak: string
  weeklyPeak: string
  currentWinStreak: number
  maxWinStreak: number
  totalPitiesEarned: number
}

export interface UserPointsData {
  nickname: string
  userId: string
  shortId: string
  points: string
  peakPoints: string
  dailyPeak: string
  weeklyPeak: string
  currentWinStreak: number
  allTimePeak: string
  pointStylePreference: string | null
  laps: number
  fastestLapBets: number
}

export interface LeaderboardEntry {
  userId: string
  shortId: string
  nickname: string
  points: string
  peakPoints: string
  gained: string
  wins: number
  losses: number
  winRate: number
  linkedinUrl: string | null
  pointStylePreference: string | null
  laps?: number
  fastestLapBets?: number | null
}

export interface ProfileData {
  userId: string
  shortId: string
  nickname: string
  points: string
  biggestWin: string
  maxWinStreak: number
  joinedDate: number
  linkedinUrl: string | null
  showLinkedinBadge: boolean
  pointStylePreference: string | null
  allTimePeak: string
}

export interface RecoverResponse {
  userId: string
  shortId: string
  nickname?: string
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
  stats: UserStats
  recentHistory: {
    gameId: string
    pick: string
    result: 'WIN' | 'LOSE'
    betAmount: string
    gain: string
  }[]
}

export interface BonusStyle {
  label: string
  color: string
  bg: string
  cardClass: string
  auraClass?: string
  amountColor?: string
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
}

export type BonusTier = 'LEGENDARY' | 'EPIC' | 'RARE' | 'COMMON'

export interface MatchRowProps {
  match: Match
  highlightPlayer?: string
  prediction?: PredictionRecord
  alwaysLeft?: boolean
  winStreak?: number
  visualMode?: string | null
}

export type LeaderboardTab = 'daily' | 'weekly' | 'alltime'
export type SortKey =
  | 'points'
  | 'gained'
  | 'peak'
  | 'wins'
  | 'losses'
  | 'winrate'
export type SortDir = 'asc' | 'desc'

export type ConfettiType =
  | 'normal'
  | 'hellfire'
  | 'lunar'
  | 'electric'
  | 'cards'
  | 'fever'
  | 'inferno'

export interface BonusData {
  tier: BonusTier
  amount: bigint
  multiplier?: number
  visualMultiplier?: number
}

export interface ResultAnim {
  win: boolean
  amount: bigint
  bonus?: BonusData | null
  confetti?: { vx: number; vy: number; leftOffset: number; delay: number }[]
  streakAfter?: number
  confettiType?: ConfettiType
  flashMult?: number
  flashEventType?: string | null
}

export type EventTheme = 'LUNAR' | 'ELECTRIC' | 'CARDS' | 'HELLFIRE' | null

export type VisualMode =
  | 'flash_lunar'
  | 'flash_electric'
  | 'flash_cards'
  | 'flash_hellfire'
  | 'inferno'
  | 'fever'
  | null