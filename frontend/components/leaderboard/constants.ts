export type Tab =
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

export const DEFAULT_SORT: Record<Tab, SortKey> = {
  daily: 'points',
  weekly: 'gained',
  alltime: 'peak',
  laps: 'laps',
  speedrun: 'fastest',
  achievements: 'achievements'
}

export const TAB_LABELS: Record<Tab, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  alltime: 'All Time',
  laps: 'Total',
  speedrun: 'Speedrun',
  achievements: 'Achievements'
}

export const EMPTY_MESSAGES: Record<Tab, string> = {
  daily: 'No bets placed today yet, be the first to claim the top spot!',
  weekly: 'Season just started, be the first to claim the weekly crown!',
  alltime: 'No predictors yet, jump in and make history!',
  laps: 'No one has ascended yet. Be the first to reach 999 OVG.',
  speedrun: 'No completed laps to rank yet.',
  achievements: 'No achievements earned yet. Be the first.'
}

export const isLapsTab = (t: Tab) => t === 'laps' || t === 'speedrun'
export const isAchievementsTab = (t: Tab) => t === 'achievements'
