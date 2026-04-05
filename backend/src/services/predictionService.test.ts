import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as predictionService from './predictionService.js'
import pool from '../utils/db.js'
import { mockDbResponse } from '../test/setup.js'

const mockQuery = vi.mocked(pool.query)
const POINT_FLOOR = 100000

describe('Prediction Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should reject bets that exceed user balance', async () => {
    mockQuery.mockResolvedValueOnce(mockDbResponse([{ points: 100000 }]))

    const result = await predictionService.savePrediction(
      'user123',
      'game456',
      'ROCK',
      150000,
      'Gambler'
    )

    expect(result.success).toBe(false)
    expect(result.error).toBe('Bet amount exceeds balance')
  })

  it('should correctly calculate winnings for a WIN result', async () => {
    const broadcastMock = vi.fn()

    // 1. Initial SELECT predictions
    mockQuery.mockResolvedValueOnce(
      mockDbResponse([
        { user_id: 'u1', pick: 'Winner', bet_amount: 50000, game_id: 'g1' }
      ])
    )
    // 2. SELECT points from getOrCreateUser
    mockQuery.mockResolvedValueOnce(mockDbResponse([{ points: 100000 }]))
    // 3. UPDATE predictions
    mockQuery.mockResolvedValueOnce(mockDbResponse([]))
    // 4. UPDATE users
    mockQuery.mockResolvedValueOnce(mockDbResponse([]))

    await predictionService.resolvePrediction('g1', 'Winner', broadcastMock)

    // Use toHaveBeenLastCalledWith to ignore the previous 3 SELECT/UPDATE calls
    expect(mockQuery).toHaveBeenLastCalledWith(
      expect.stringContaining('SET points = $1'), // Shorter string is safer against newlines
      [150000, 'u1']
    )
  })

  it('should enforce the NEW POINTS_FLOOR on a loss', async () => {
    const broadcastMock = vi.fn()

    // 1. Initial SELECT in resolvePrediction
    mockQuery.mockResolvedValueOnce(
      mockDbResponse([
        { user_id: 'u1', pick: 'Loser', bet_amount: 50000, nickname: 'Alice' }
      ])
    )
    // 2. First SELECT in getOrCreateUser
    mockQuery.mockResolvedValueOnce(mockDbResponse([{ points: 120000 }]))

    // 3. UPDATE predictions
    mockQuery.mockResolvedValueOnce(mockDbResponse([]))

    // 4. UPDATE users
    mockQuery.mockResolvedValueOnce(mockDbResponse([]))

    await predictionService.resolvePrediction('g1', 'Winner', broadcastMock)

    // Logic: 120k - (50k/2) = 95k. 95k < FLOOR(100k), so result should be 100k.
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('SET points = $1'),
      expect.arrayContaining([100000, 'u1'])
    )
  })

  it('should validate recovery code format [word-word-number]', () => {
    const code = predictionService.generateRecoveryCode()
    expect(code).toMatch(/^[a-z]+-[a-z]+-\d{4}$/)
  })
})
