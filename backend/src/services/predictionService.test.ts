import { describe, it, expect, vi } from 'vitest'
import * as predictionService from './predictionService.js'
import pool from '../utils/db.js'
import { mockDbResponse } from '../test/setup.js'

const mockQuery = vi.mocked(pool.query)

describe('Prediction Service', () => {
  it('should reject bets that exceed user balance', async () => {
    mockQuery.mockResolvedValue(mockDbResponse([{ points: 500 }]))

    const result = await predictionService.savePrediction(
      'user123',
      'game456',
      'ROCK',
      1000,
      'Gambler'
    )

    expect(result.success).toBe(false)
    expect(result.error).toBe('Bet amount exceeds balance')
  })

  it('should correctly calculate winnings for a WIN result', async () => {
    const broadcastMock = vi.fn()
    // Call 1: Fetching predictions
    mockQuery.mockResolvedValueOnce(
      mockDbResponse([{ user_id: 'u1', pick: 'Winner', bet_amount: 500 }])
    )
    // Call 2: Update result status
    mockQuery.mockResolvedValueOnce(mockDbResponse([]))
    // Call 3: Get current points
    mockQuery.mockResolvedValueOnce(mockDbResponse([{ points: 1000 }]))
    // Call 4: Update final points (1000 + 500 = 1500)
    mockQuery.mockResolvedValueOnce(mockDbResponse([]))

    await predictionService.resolvePrediction('g1', 'Winner', broadcastMock)

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE users SET points = $1'),
      [1500, 'u1']
    )
  })

  it('should enforce the POINTS_FLOOR on a loss', async () => {
    const broadcastMock = vi.fn()
    // 1100 points - 500 bet = 850 (below floor). Should result in 1000.
    mockQuery.mockResolvedValueOnce(
      mockDbResponse([{ user_id: 'u1', pick: 'Loser', bet_amount: 500 }])
    )
    mockQuery.mockResolvedValueOnce(mockDbResponse([]))
    mockQuery.mockResolvedValueOnce(mockDbResponse([{ points: 1100 }]))
    mockQuery.mockResolvedValueOnce(mockDbResponse([]))

    await predictionService.resolvePrediction('g1', 'Winner', broadcastMock)

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('SET points = $1'),
      [1000, 'u1']
    )
  })

  it('should validate recovery code format [word-word-number]', () => {
    const code = predictionService.generateRecoveryCode()
    expect(code).toMatch(/^[a-z]+-[a-z]+-\d{4}$/)
  })
})
