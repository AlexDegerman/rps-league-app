export type Move = "ROCK" | "PAPER" | "SCISSORS"

export interface PlayerResult {
  name: string
  played: Move
}

export interface Match {
  type: string
  gameId: string
  time: number | string
  playerA: Player
  playerB: Player
  comment?: number
}

export interface Player {
  name: string
  played: string
}

export interface LeaderboardEntry {
  playerName: string
  wins: number
  losses: number
  ties: number
}