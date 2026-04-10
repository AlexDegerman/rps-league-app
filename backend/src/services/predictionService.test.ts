import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as predictionService from './predictionService.js'
import { generateRecoveryCode } from './userService.js'
import pool from '../utils/db.js'
import { mockDbResponse } from '../test/setup.js'

const mockQuery = vi.mocked(pool.query)

const makeRow = (overrides = {}) => ({
  user_id: 'u1',
  game_id: 'g1',
  pick: 'Winner',
  bet_amount: '50000',
  current_points: '500000',
  nickname: 'TestUser',
  total_bets: '10',
  bonus_pity_count: '0',
  result: null,
  ...overrides
})

describe('Prediction Service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects bets that exceed user balance', async () => {
    // getOrCreateUser: SELECT points, short_id
    mockQuery.mockResolvedValueOnce(
      mockDbResponse([{ points: '100000', short_id: 'abc123' }])
    )
    const result = await predictionService.savePrediction(
      'user123',
      'game456',
      'ROCK',
      150000n,
      'Gambler',
      'abc123'
    )
    expect(result.success).toBe(false)
    expect(result.error).toBe('Bet amount exceeds balance')
  })

  it('applies a positive gain_loss to user points on a WIN', async () => {
    const broadcastMock = vi.fn()
    // resolvePrediction: JOIN fetch
    mockQuery.mockResolvedValueOnce(mockDbResponse([makeRow()]))
    // UPDATE predictions
    mockQuery.mockResolvedValueOnce(mockDbResponse([]))
    // UPDATE users
    mockQuery.mockResolvedValueOnce(mockDbResponse([]))

    await predictionService.resolvePrediction('g1', 'Winner', broadcastMock)

    expect(broadcastMock).toHaveBeenCalledWith(
      'prediction_result',
      expect.stringContaining('"result":"WIN"')
    )

    const updateCall = mockQuery.mock.calls.find(
      ([sql]) => typeof sql === 'string' && sql.includes('peak_points')
    )
    expect(updateCall).toBeDefined()
    expect(BigInt(updateCall![1][0])).toBeGreaterThan(0n)
  })

  it('clamps loss so points never drop below POINTS_FLOOR (100k)', async () => {
    const broadcastMock = vi.fn()
    mockQuery.mockResolvedValueOnce(
      mockDbResponse([makeRow({ pick: 'Loser', current_points: '120000' })])
    )
    mockQuery.mockResolvedValueOnce(mockDbResponse([]))
    mockQuery.mockResolvedValueOnce(mockDbResponse([]))

    await predictionService.resolvePrediction('g1', 'Winner', broadcastMock)

    const updateCall = mockQuery.mock.calls.find(
      ([sql]) => typeof sql === 'string' && sql.includes('peak_points')
    )
    expect(updateCall).toBeDefined()
    const gainLoss = BigInt(updateCall![1][0])
    expect(120000n + gainLoss).toBeGreaterThanOrEqual(100000n)
  })

  it('generates recovery codes in word-word-4digit format', () => {
    const code = generateRecoveryCode()
    expect(code).toMatch(/^[a-z]+-[a-z]+-\d{4}$/)
  })
})
