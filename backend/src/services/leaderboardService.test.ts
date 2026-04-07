import { describe, it, expect, vi } from 'vitest'
import * as leaderboardService from './leaderboardService.js'
import pool from '../utils/db.js'
import { mockDbResponse } from '../test/setup.js'

const mockQuery = vi.mocked(pool.query)

describe('Leaderboard Service', () => {
  it('ranks players by wins descending, then alphabetically on ties', async () => {
    // Ant wins once, Zebra wins once — tied on wins, so alphabetical order applies
    mockQuery.mockResolvedValue(
      mockDbResponse([
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
      ])
    )

    const leaderboard = await leaderboardService.getTodayLeaderboard()

    expect(leaderboard[0]!.name).toBe('Ant')
    expect(leaderboard[1]!.name).toBe('Zebra')
  })

  it('rounds win rates to the nearest whole number', async () => {
    // A wins 2/3 matches = 66.6...% → should round to 67
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

  it('pads the end date by 24h so a single-day range covers the full day', async () => {
    mockQuery.mockResolvedValue(mockDbResponse([]))

    const dateStr = '2026-04-01'
    await leaderboardService.getHistoricalLeaderboard(dateStr, dateStr)

    const params = mockQuery.mock.calls[0]![1] as any[]
    const startTs = new Date(dateStr).getTime()

    expect(params[0]).toBe(startTs)
    expect(params[1]).toBe(startTs + 86400000) // exactly +24h
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('WHERE time >= $1 AND time < $2'),
      params
    )
  })
})
