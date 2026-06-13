import { describe, it, expect, vi } from 'vitest'
import * as matchService from './matchService.js'
import pool from '../utils/db.js'

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
    mockQuery.mockResolvedValueOnce({ rows: [{}, {}] } as any)
    let res1 = await matchService.getLatestMatches(1, 2)
    expect(res1.hasMore).toBe(true)

    mockQuery.mockResolvedValueOnce({ rows: [{}] } as any)
    res1 = await matchService.getLatestMatches(3, 2)
    expect(res1.hasMore).toBe(false)
  })

  it('should aggregate player stats correctly', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ wins: 1, total: 2 }]
    } as any)

    const stats = await matchService.getPlayerStats('Alice')
    expect(stats.wins).toBe(1)
    expect(stats.losses).toBe(1)
    expect(stats.winRate).toBe(50)
  })

  it('should handle player stats for a player with no matches', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ wins: 0, total: 0 }]
    } as any)

    const stats = await matchService.getPlayerStats('Charlie')
    expect(stats.wins).toBe(0)
    expect(stats.losses).toBe(0)
    expect(stats.winRate).toBe(0)
  })

  it('should handle player stats for a player with only wins', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ wins: 3, total: 3 }]
    } as any)

    const stats = await matchService.getPlayerStats('David')
    expect(stats.wins).toBe(3)
    expect(stats.losses).toBe(0)
    expect(stats.winRate).toBe(100)
  })

  it('should handle player stats for a player with only losses', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ wins: 0, total: 2 }]
    } as any)

    const stats = await matchService.getPlayerStats('Eve')
    expect(stats.wins).toBe(0)
    expect(stats.losses).toBe(2)
    expect(stats.winRate).toBe(0)
  })
})
