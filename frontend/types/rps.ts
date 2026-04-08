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
}

export interface SinglePlayerStats {
  total: number
  wins: number
  losses: number
  winRate: number
}

export interface UserStats {
  joined_date: string
  // Basic Aggregates
  total: number
  wins: number
  losses: number
  winRate: number

  // Wealth & Volume (Strings for High Precision)
  points: string
  total_gain: string
  total_volume: string
  biggest_win: string
  avg_return: string

  // Peak Records (Strings for High Precision)
  peak_points: string
  daily_peak: string
  weekly_peak: string

  // Skill & IQ (Numbers)
  current_win_streak: number
  max_win_streak: number
  total_pities_earned: number
}