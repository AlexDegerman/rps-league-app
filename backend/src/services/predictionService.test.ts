import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as predictionService from './predictionService.js'
import pool from '../utils/db.js'
import { mockDbResponse } from '../test/setup.js'

const mockQuery = vi.mocked(pool.query)

// Mirrors the shape of rows returned by the JOIN query in resolvePrediction.
// All numeric fields are strings because pg returns numerics as strings.
const makeRow = (overrides = {}) => ({
  user_id: 'u1',
  game_id: 'g1',
  pick: 'Winner',
  bet_amount: '50000',
  current_points: '500000', // aliased from u.points in the JOIN
  nickname: 'TestUser',
  total_bets: '10', // COUNT(*) returns string from pg
  result: null,
  ...overrides
})

describe('Prediction Service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects bets that exceed user balance', async () => {
    // getOrCreateUser does SELECT points — return less than the bet
    mockQuery.mockResolvedValueOnce(mockDbResponse([{ points: '100000' }]))

    const result = await predictionService.savePrediction(
      'user123',
      'game456',
      'ROCK',
      150000n,
      'Gambler'
    )

    expect(result.success).toBe(false)
    expect(result.error).toBe('Bet amount exceeds balance')
  })

  it('applies a positive gain_loss to user points on a WIN', async () => {
    const broadcastMock = vi.fn()

    // Query order: 1) JOIN fetch, 2) UPDATE predictions, 3) UPDATE users
    mockQuery.mockResolvedValueOnce(mockDbResponse([makeRow()]))
    mockQuery.mockResolvedValueOnce(mockDbResponse([]))
    mockQuery.mockResolvedValueOnce(mockDbResponse([]))

    await predictionService.resolvePrediction('g1', 'Winner', broadcastMock)

    expect(broadcastMock).toHaveBeenCalledWith(
      'prediction_result',
      expect.stringContaining('"result":"WIN"')
    )

    // Find the UPDATE users query by its unique peak_points column
    const updateCall = mockQuery.mock.calls.find(
      ([sql]) => typeof sql === 'string' && sql.includes('peak_points')
    )
    expect(updateCall).toBeDefined()
    // gain_loss must be positive — winning always increases points
    expect(BigInt(updateCall![1][0])).toBeGreaterThan(0n)
  })

  it('clamps loss so points never drop below POINTS_FLOOR (100k)', async () => {
    const broadcastMock = vi.fn()

    // 120k balance, 50k bet, loses — naive loss would bring to 70k,
    // but floor enforcement means gain_loss = 100k - 120k = -20k
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
    // Test the invariant, not the exact value — rollBonus can affect the amount
    expect(120000n + gainLoss).toBeGreaterThanOrEqual(100000n)
  })

  it('generates recovery codes in word-word-4digit format', () => {
    const code = predictionService.generateRecoveryCode()
    expect(code).toMatch(/^[a-z]+-[a-z]+-\d{4}$/)
  })
})
