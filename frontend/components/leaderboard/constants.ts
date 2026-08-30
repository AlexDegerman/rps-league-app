import { LeaderboardTab, SortKey } from "@/types/leaderboard"

export const DEFAULT_SORT: Record<LeaderboardTab, SortKey> = {
  daily: 'points',
  weekly: 'gained',
  alltime: 'peak',
  laps: 'laps',
  speedrun: 'fastest',
  achievements: 'achievements'
}

export const TAB_LABELS: Record<LeaderboardTab, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  alltime: 'All Time',
  laps: 'Total',
  speedrun: 'Speedrun',
  achievements: 'Achievements'
}

export const EMPTY_MESSAGES: Record<LeaderboardTab, string> = {
  daily: 'No bets placed today yet, be the first to claim the top spot!',
  weekly: 'Season just started, be the first to claim the weekly crown!',
  alltime: 'No predictors yet, jump in and make history!',
  laps: 'No one has ascended yet. Be the first to reach 999 STR.',
  speedrun: 'No completed laps to rank yet.',
  achievements: 'No achievements earned yet. Be the first.'
}

export const isLapsTab = (t: LeaderboardTab) => t === 'laps' || t === 'speedrun'
export const isAchievementsTab = (t: LeaderboardTab) => t === 'achievements'
