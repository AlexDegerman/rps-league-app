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