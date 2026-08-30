import { BadgeData } from './leaderboard'

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
  linkedinUrl: string | null
  showLinkedinBadge: boolean
  recoveryCode?: string | null
  autoEquipBadges?: boolean
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
  autoEquipBadges?: boolean
}

export interface RecoverResponse {
  userId: string
  shortId: string
  nickname?: string
}
