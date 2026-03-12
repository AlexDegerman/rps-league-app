export interface Player {
  name: string
  played: 'ROCK' | 'PAPER' | 'SCISSORS' | string
}

export interface Match {
  type: 'GAME_RESULT'
  gameId: string
  time: number
  playerA: Player
  playerB: Player
}

export interface PlayerStats {
  name: string
  wins: number
  losses: number
  ties: number
}