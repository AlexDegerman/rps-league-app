import type { Match, Move } from "../types/rps.js";

export const rowToMatch = (row: Record<string, unknown>): Match => ({
  type: row.type as string,
  gameId: row.game_id as string,
  time: Number(row.time),
  expiresAt: row.expires_at ? Number(row.expires_at) : Number(row.time),
  playerA: {
    name: row.player_a_name as string,
    played: row.player_a_played as Move
  },
  playerB: {
    name: row.player_b_name as string,
    played: row.player_b_played as Move
  }
})
