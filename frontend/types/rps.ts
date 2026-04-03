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
  total: number
  wins: number
  losses: number
  winRate: number
}