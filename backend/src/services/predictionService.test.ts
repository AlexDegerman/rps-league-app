import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as predictionService from './predictionService.js'
import { generateRecoveryCode } from './userService.js'
import pool from '../utils/db.js'
import { mockDbResponse } from '../test/setup.js'

vi.mock('./oracleService.js', () => ({
  hasUserUsedOracle: vi.fn(() => Promise.resolve(true)),
  consumeOracleForUser: vi.fn(() => Promise.resolve()),
  getOracleState: vi.fn(() => ({ side: 'left' }))
}))

vi.mock('./flashEventService.js', () => ({
  getFlashEventForUser: vi.fn(() => null),
  consumeFlashBetForUser: vi.fn(),
  tryTriggerFlashEventForUser: vi.fn(),
  recordSessionFlashType: vi.fn(),
  hasSeenAllFlashTypes: vi.fn(() => false)
}))

vi.mock('./festivalService.js', () => ({
  checkAndTriggerFestival: vi.fn(),
  getGuaranteedBonusRemaining: vi.fn(() => 0),
  consumeGuaranteedBonus: vi.fn(),
  getActiveFestival: vi.fn(() => null)
}))

vi.mock('./achievementChecker.js', () => ({
  checkAchievements: vi.fn(() => [])
}))

vi.mock('./relicService.js', () => ({
  RELICS: [],
  rollRelicDrop: vi.fn(() => Promise.resolve(null)),
  rollBonus: vi.fn(() => null)
}))

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
  current_win_streak: '0',
  player_a_name: 'Winner',
  player_b_name: 'Loser',
  bet_against_oracle: false,
  equipped_relic: null,
  relic_counter: '0',
  ...overrides
})

const mockUserStatsRow = {
  wins: '0',
  max_win_streak: '0',
  laps: '0',
  points: '500000',
  biggest_match_mult: '0',
  total_pities_earned: '0',
  lunar_events_caught: '0',
  electric_events_caught: '0',
  hellfire_events_caught: '0',
  cards_events_caught: '0',
  bet_against_oracle_count: '0',
  oracle_max_streak: '0',
  festivals_triggered: '0',
  festivals_participated: '0',
  consecutive_flash_peak: '0',
  has_used_auto_bet: false
}

describe('Prediction Service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects bets that exceed user balance', async () => {
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
    expect(result.error).toBe('Bet could not be processed')
  })

  it('applies a positive gain_loss to user points on a WIN', async () => {
    const broadcastMock = vi.fn()

    // 1. JOIN fetch (predictions + users LEFT JOIN relics)
    mockQuery.mockResolvedValueOnce(mockDbResponse([makeRow()]))
    // 2. UPDATE predictions
    mockQuery.mockResolvedValueOnce(mockDbResponse([]))
    // 3. UPDATE users
    mockQuery.mockResolvedValueOnce(mockDbResponse([]))
    // 4. SELECT users for achievement stats
    mockQuery.mockResolvedValueOnce(mockDbResponse([mockUserStatsRow]))
    // 5. SELECT user_achievements
    mockQuery.mockResolvedValueOnce(mockDbResponse([]))
    // 6. SELECT relics for relic count (uniqueRelicsOwned / mythCount checks)
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

    // 1. JOIN fetch
    mockQuery.mockResolvedValueOnce(
      mockDbResponse([makeRow({ pick: 'Loser', current_points: '120000' })])
    )
    // 2. UPDATE predictions
    mockQuery.mockResolvedValueOnce(mockDbResponse([]))
    // 3. UPDATE users
    mockQuery.mockResolvedValueOnce(mockDbResponse([]))
    // 4. SELECT users for achievement stats
    mockQuery.mockResolvedValueOnce(mockDbResponse([mockUserStatsRow]))
    // 5. SELECT user_achievements
    mockQuery.mockResolvedValueOnce(mockDbResponse([]))
    // 6. SELECT relics for relic count
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
