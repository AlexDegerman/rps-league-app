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

    mockQuery.mockResolvedValueOnce(
      mockDbResponse([
        { user_id: 'u1', pick: 'Winner', bet_amount: 50000, game_id: 'g1' }
      ])
    )

    mockQuery.mockResolvedValueOnce(mockDbResponse([{ points: 100000 }]))
    mockQuery.mockResolvedValueOnce(mockDbResponse([]))
    mockQuery.mockResolvedValueOnce(mockDbResponse([]))

    await predictionService.resolvePrediction('g1', 'Winner', broadcastMock)

    expect(mockQuery).toHaveBeenLastCalledWith(
      expect.stringContaining('SET points = $1'),
      [150000, 'u1']
    )
  })

  it('should enforce the NEW POINTS_FLOOR on a loss', async () => {
    const broadcastMock = vi.fn()

    mockQuery.mockResolvedValueOnce(
      mockDbResponse([
        { user_id: 'u1', pick: 'Loser', bet_amount: 50000, nickname: 'Alice' }
      ])
    )

    mockQuery.mockResolvedValueOnce(mockDbResponse([{ points: 120000 }]))
    mockQuery.mockResolvedValueOnce(mockDbResponse([]))
    mockQuery.mockResolvedValueOnce(mockDbResponse([]))

    await predictionService.resolvePrediction('g1', 'Winner', broadcastMock)

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
