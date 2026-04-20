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
  // Bet history fields (populated from DB, not from live SSE)
  id?: number
  betAmount?: string
  gainLoss?: string
  bonusTier?: string | null
  bonusMultiplier?: number
  createdAt?: number
  flashEventType?: string | null
  flashMult?: number
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