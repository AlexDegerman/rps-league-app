import { describe, it, expect, vi } from 'vitest'
import * as leaderboardService from './leaderboardService.js'
import pool from '../utils/db.js'
import { mockDbResponse } from '../test/setup.js'

const mockQuery = vi.mocked(pool.query)

describe('Leaderboard Service', () => {
  it('should rank players by wins, then alphabetically', async () => {
    const mockRows = [
      {
        player_a_name: 'Zebra',
        player_a_played: 'ROCK',
        player_b_name: 'Ant',
        player_b_played: 'SCISSORS'
      },
      {
        player_a_name: 'Ant',
        player_a_played: 'ROCK',
        player_b_name: 'Zebra',
        player_b_played: 'SCISSORS'
      }
    ]
    mockQuery.mockResolvedValue(mockDbResponse(mockRows))

    const leaderboard = await leaderboardService.getTodayLeaderboard()

    expect(leaderboard[0]!.name).toBe('Ant')
    expect(leaderboard[1]!.name).toBe('Zebra')
  })

  it('should round win rates to the nearest whole number', async () => {
    mockQuery.mockResolvedValue(
      mockDbResponse([
        {
          player_a_name: 'A',
          player_a_played: 'ROCK',
          player_b_name: 'B',
          player_b_played: 'SCISSORS'
        },
        {
          player_a_name: 'A',
          player_a_played: 'ROCK',
          player_b_name: 'B',
          player_b_played: 'SCISSORS'
        },
        {
          player_a_name: 'B',
          player_a_played: 'ROCK',
          player_b_name: 'A',
          player_b_played: 'SCISSORS'
        }
      ])
    )

    const board = await leaderboardService.getTodayLeaderboard()
    expect(board.find((p) => p.name === 'A')!.winRate).toBe(67)
  })

  it('should build historical query with 24-hour end-date padding', async () => {
    mockQuery.mockResolvedValue(mockDbResponse([]))
    const startStr = '2026-04-01'

    await leaderboardService.getHistoricalLeaderboard(startStr, startStr)

    const params = mockQuery.mock.calls[0]![1] as any[]
    const startTs = new Date(startStr).getTime()

    expect(params[0]).toBe(startTs)
    expect(params[1]).toBe(startTs + 86400000) // Verifies +1 day padding
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('WHERE time >= $1 AND time < $2'),
      params
    )
  })
})
