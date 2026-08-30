import { AchievementRarity } from './achievements'

export type LeaderboardTab =
  | 'daily'
  | 'weekly'
  | 'alltime'
  | 'laps'
  | 'speedrun'
  | 'achievements'

export type SortKey =
  | 'points'
  | 'gained'
  | 'peak'
  | 'wins'
  | 'losses'
  | 'winrate'
  | 'laps'
  | 'fastest'
  | 'achievements'

export type SortDir = 'asc' | 'desc'

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
  achievementCount?: number
  showLinkedinBadge: boolean
}

export interface BadgeData {
  code: string
  name: string
  icon: string
  rarity: AchievementRarity
}

export interface AchievementEntry extends BadgeData {
  requirement: string
  category: string
  earned: boolean
  earnedAt: number | null
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