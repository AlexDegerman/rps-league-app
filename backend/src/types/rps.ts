export type Move = 'ROCK' | 'PAPER' | 'SCISSORS'

export interface Player {
  name: string
  played: Move
}

export interface Match {
  type: string
  gameId: string
  time: number
  expiresAt: number
  playerA: Player
  playerB: Player
}

export interface PlayerStats {
  name: string
  wins: number
  losses: number
  winRate: number
}
