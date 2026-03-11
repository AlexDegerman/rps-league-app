export type Move = "ROCK" | "PAPER" | "SCISSORS"
export interface PlayerResult {
  name: string
  played: Move
}
export interface Match {
  type: "GAME_RESULT"
  gameId: string
  time: number         // Unix timestamp in milliseconds
  playerA: PlayerResult
  playerB: PlayerResult
}
export interface LeaderboardEntry {
  playerName: string
  wins: number
  losses: number
  ties: number
}