import { describe, it, expect, vi } from 'vitest'
import * as matchService from './matchService.js'
import pool from '../utils/db.js'
import { mockDbResponse } from '../test/setup.js'

const mockQuery = vi.mocked(pool.query)

describe('Match Service', () => {
  it('should correctly identify winners and treat draws as B wins', () => {
    const mockMatch = (a: any, b: any): any => ({
      playerA: { played: a },
      playerB: { played: b }
    })

    expect(matchService.getWinner(mockMatch('ROCK', 'SCISSORS'))).toBe('A')
    expect(matchService.getWinner(mockMatch('PAPER', 'ROCK'))).toBe('A')
    expect(matchService.getWinner(mockMatch('ROCK', 'ROCK'))).toBe('B')
  })

  it('should accurately calculate total pages and hasMore flag', async () => {
    mockQuery.mockResolvedValueOnce(mockDbResponse([{}, {}]))
    mockQuery.mockResolvedValueOnce(mockDbResponse([{ count: '5' }]))
    const res1 = await matchService.getLatestMatches(1, 2)
    expect(res1.hasMore).toBe(true)

    mockQuery.mockResolvedValueOnce(mockDbResponse([{}]))
    mockQuery.mockResolvedValueOnce(mockDbResponse([{ count: '5' }]))
    const res2 = await matchService.getLatestMatches(3, 2)
    expect(res2.hasMore).toBe(false)
  })

  it('should aggregate player stats correctly', async () => {
    const rows = [
      {
        player_a_name: 'Alice',
        player_a_played: 'ROCK',
        player_b_name: 'Bob',
        player_b_played: 'SCISSORS'
      },
      {
        player_a_name: 'Alice',
        player_a_played: 'SCISSORS',
        player_b_name: 'Bob',
        player_b_played: 'ROCK'
      }
    ]
    mockQuery.mockResolvedValue(mockDbResponse(rows))

    const stats = await matchService.getPlayerStats('Alice')
    expect(stats.wins).toBe(1)
    expect(stats.losses).toBe(1)
    expect(stats.winRate).toBe(50)
  })
})
