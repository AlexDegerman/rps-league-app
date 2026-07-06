import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as predictionService from './predictionService.js'
import pool from '../utils/db.js'
import { mockDbResponse } from '../test/setup.js'

// Test-only interfaces used by mocked services.
interface ActiveGlobalEvent {
  type: string
  phase: string
}

interface ActiveFestival {
  type: string
}

interface FlashEvent {
  type: string
  multiplier: number
  snapshotRelic?: string | null
}

interface ExecutedQuery {
  sql: string
  params: any[]
}

// Mutable mock state shared across mocked modules.
const mockActiveGlobalEvent: { value: ActiveGlobalEvent | null } = {
  value: null
}
const mockActiveFestival: { value: ActiveFestival | null } = { value: null }
const mockFlashEvent: { value: FlashEvent | null } = { value: null }

// System-level module mocks
vi.mock('./oracleService.js', () => ({
  hasUserUsedOracle: vi.fn(() => Promise.resolve(true)),
  consumeOracleForUser: vi.fn(() => Promise.resolve()),
  getOracleState: vi.fn(() => ({ side: 'left' }))
}))

vi.mock('./flashEventService.js', () => ({
  getFlashEventForUser: vi.fn(() => mockFlashEvent.value),
  consumeFlashBetForUser: vi.fn(() => false),
  tryTriggerFlashEventForUser: vi.fn(),
  recordSessionFlashType: vi.fn(),
  hasSeenAllFlashTypes: vi.fn(() => false)
}))

vi.mock('./festivalService.js', () => ({
  checkAndTriggerFestival: vi.fn(),
  getGuaranteedBonusRemaining: vi.fn(() => 0),
  consumeGuaranteedBonus: vi.fn(),
  getActiveFestival: vi.fn(() => mockActiveFestival.value),
  triggerVaultFestival: vi.fn(),
  triggerSafeguardFestival: vi.fn()
}))

vi.mock('./globalEventService.js', () => ({
  applyGlobalEventBuff: vi.fn(
    (isWin: boolean, gainLoss: bigint, bet: bigint) => {
      const isSolarFlareActive =
        mockActiveGlobalEvent.value?.type === 'SOLAR_FLARE' &&
        mockActiveGlobalEvent.value?.phase === 'active'
      return {
        gainLossMultiplied: isSolarFlareActive ? gainLoss * 2n : gainLoss,
        echoAmount: 0n,
        buffType: mockActiveGlobalEvent.value?.type ?? null
      }
    }
  ),
  getActiveGlobalEvent: vi.fn(() => mockActiveGlobalEvent.value)
}))

vi.mock('./relicService.js', () => ({
  RELICS: Array.from({ length: 15 }, (_, i) => ({ key: `relic_${i}` })),
  rollRelicDrop: vi.fn(() => Promise.resolve(null))
}))

vi.mock('./sessionService.js', () => ({
  recordInteraction: vi.fn(() => Promise.resolve())
}))

vi.mock('../utils/badgeHelper.js', () => ({
  autoEquipUserBadges: vi.fn(() => Promise.resolve())
}))

// Partially mock userService while preserving unrelated exports.
vi.mock('./userService.js', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, any>
  return {
    ...actual,
    getOrCreateUser: vi.fn(() =>
      Promise.resolve({ points: 500000n, shortId: 'abc123' })
    )
  }
})

vi.mock('../utils/logger.js', () => ({
  logger: {
    error: vi.fn(),
    errorWithPoints: vi.fn()
  }
}))

const mockQuery = vi.mocked(pool.query)

// Mutable test fixtures reset before each test.
let currentPredictionRow: any
let nicknameCheckRows: any[]
let matchCheckRows: any[]
let currentUserStatsRow: any
let userAchievementsRows: any[]
let userRelicsRows: any[]
let savePredictionRowCount: number
let queriesExecuted: Array<ExecutedQuery>

const makeRow = (overrides: Record<string, any> = {}) => ({
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
  has_used_auto_bet: false,
  auto_equip_badges: false
}

describe('Prediction Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()

    mockActiveGlobalEvent.value = null
    mockActiveFestival.value = null
    mockFlashEvent.value = null

    currentPredictionRow = makeRow()
    nicknameCheckRows = []
    matchCheckRows = [
      {
        expires_at: (Date.now() + 100000).toString(),
        player_a_name: 'Winner',
        player_b_name: 'Loser'
      }
    ]
    currentUserStatsRow = { ...mockUserStatsRow }
    userAchievementsRows = []
    userRelicsRows = []
    savePredictionRowCount = 1
    queriesExecuted = []

    // Route SQL queries to mock responses using substring matching.
    mockQuery.mockImplementation(
      async (sql: any, params?: any): Promise<any> => {
        const sqlStr = typeof sql === 'string' ? sql : ''
        queriesExecuted.push({ sql: sqlStr, params: params ?? [] })

        if (sqlStr.includes('SELECT user_id FROM users WHERE nickname =')) {
          return mockDbResponse(nicknameCheckRows)
        }
        if (
          sqlStr.includes(
            'SELECT expires_at, player_a_name, player_b_name FROM matches'
          )
        ) {
          return mockDbResponse(matchCheckRows)
        }
        if (
          sqlStr.includes('SELECT') &&
          sqlStr.includes('predictions p') &&
          sqlStr.includes('JOIN users u')
        ) {
          return mockDbResponse([currentPredictionRow])
        }
        if (
          sqlStr.includes('SELECT wins, max_win_streak') &&
          sqlStr.includes('FROM users')
        ) {
          return mockDbResponse([currentUserStatsRow])
        }
        if (sqlStr.includes('SELECT achievement_code FROM user_achievements')) {
          return mockDbResponse(userAchievementsRows)
        }
        if (sqlStr.includes('SELECT relic_key, rarity FROM relics')) {
          return mockDbResponse(userRelicsRows)
        }
        if (sqlStr.includes('INSERT INTO predictions')) {
          return { rowCount: savePredictionRowCount }
        }
        // Must precede the generic COUNT matcher.
        if (sqlStr.includes('total_bets') && sqlStr.includes('predictions')) {
          return mockDbResponse([
            {
              total_bets: '100',
              total_volume: '5000000',
              winning_bets: '60'
            }
          ])
        }
        if (sqlStr.includes('COUNT(*)') && sqlStr.includes('predictions')) {
          return mockDbResponse([{ count: '15' }])
        }
        if (
          sqlStr.includes('SELECT') &&
          sqlStr.includes('predictions p') &&
          sqlStr.includes('LEFT JOIN matches m')
        ) {
          return mockDbResponse([
            {
              id: 'p1',
              gameId: 'g1',
              pick: 'Winner',
              betAmount: '50000',
              gainLoss: '100000',
              result: 'WIN',
              bonusTier: 'RARE',
              bonusMultiplier: 2.5,
              flashEventType: null,
              flashMult: 1,
              streakMultiplier: 1,
              createdAt: Date.now(),
              relicMultiplier: 1,
              totalMultiplier: 2,
              festivalMultiplier: 1,
              festivalType: null,
              globalEventType: null,
              globalEchoAmount: null,
              player_a_name: 'Winner',
              player_b_name: 'Loser',
              time: Date.now().toString(),
              type: 'GAME_RESULT'
            }
          ])
        }
        if (
          sqlStr.includes('FROM users u') &&
          sqlStr.includes('LEFT JOIN (') &&
          sqlStr.includes('predictions')
        ) {
          return mockDbResponse([
            {
              points: '500000',
              peak_points: '600000',
              daily_peak: '550000',
              weekly_peak: '580000',
              total_volume: '1500000',
              biggest_win: '200000',
              current_win_streak: '5',
              max_win_streak: '10',
              bonus_pity_count: '2',
              total_pities_earned: '3',
              joined_date: '1700000000000',
              wins: '12',
              losses: '3',
              total_gain: '450000'
            }
          ])
        }

        return mockDbResponse([])
      }
    )
  })

  // Core prediction resolution behavior
  it('rejects bets that exceed user balance', async () => {
    const result = await predictionService.savePrediction(
      'user123',
      'game456',
      'Winner',
      1000000n,
      'Gambler',
      'abc123'
    )
    expect(result.success).toBe(false)
    expect(result.error).toBe('Bet could not be processed')
  })

  it('applies a positive gain_loss to user points on a WIN', async () => {
    const broadcastMock = vi.fn()

    await predictionService.resolvePrediction('g1', 'Winner', broadcastMock)

    expect(broadcastMock).toHaveBeenCalledWith(
      'prediction_result',
      expect.stringContaining('"result":"WIN"')
    )

    const updateCall = queriesExecuted.find((q) =>
      q.sql.includes('UPDATE users')
    )
    expect(updateCall).toBeDefined()
    expect(BigInt(updateCall!.params[0])).toBeGreaterThan(0n)
  })

  it('clamps loss so points never drop below POINTS_FLOOR (100k)', async () => {
    const broadcastMock = vi.fn()
    currentPredictionRow = makeRow({ pick: 'Loser', current_points: '120000' })

    await predictionService.resolvePrediction('g1', 'Winner', broadcastMock)

    const updateCall = queriesExecuted.find((q) =>
      q.sql.includes('UPDATE users')
    )
    expect(updateCall).toBeDefined()
    const gainLoss = BigInt(updateCall!.params[0])
    expect(120000n + gainLoss).toBeGreaterThanOrEqual(100000n)
  })

  // savePrediction validation
  describe('savePrediction parameters and database checks', () => {
    it('returns error if match selection window is closed', async () => {
      matchCheckRows[0].expires_at = (Date.now() - 5000).toString()

      const result = await predictionService.savePrediction(
        'u1',
        'g1',
        'Winner',
        1000n,
        'TestUser',
        'abc123'
      )
      expect(result.success).toBe(false)
      expect(result.error).toBe('Selection window closed')
    })

    it('returns error if nickname is taken by another user', async () => {
      nicknameCheckRows = [{ user_id: 'u2' }]

      const result = await predictionService.savePrediction(
        'u1',
        'g1',
        'Winner',
        1000n,
        'ClashNick',
        'abc123'
      )
      expect(result.success).toBe(false)
      expect(result.error).toBe('Nickname unavailable')
    })

    it('returns conflict error if prediction was already placed', async () => {
      savePredictionRowCount = 0

      const result = await predictionService.savePrediction(
        'u1',
        'g1',
        'Winner',
        1000n,
        'UniqueNick',
        'abc123'
      )
      expect(result.success).toBe(false)
      expect(result.error).toBe('BET ALREADY PLACED')
    })
  })

  // Architect's Keystone
  describe("Architect's Keystone", () => {
    it('upgrades rolled COMMON tier to RARE', async () => {
      const broadcastMock = vi.fn()
      currentPredictionRow = makeRow({
        equipped_relic: 'architects_keystone'
      })

      // Mock random sequence:
      // 1. Pass bonus chance check.
      // 2. Roll a COMMON bonus.
      let rollIndex = 0
      vi.spyOn(Math, 'random').mockImplementation(() => {
        rollIndex++
        if (rollIndex === 1) return 0.1
        if (rollIndex === 2) return 0.2
        return 0.5
      })

      await predictionService.resolvePrediction('g1', 'Winner', broadcastMock)

      const predUpdate = queriesExecuted.find((q) =>
        q.sql.includes('UPDATE predictions')
      )
      expect(predUpdate).toBeDefined()
      expect(predUpdate!.params[2]).toBe('RARE')
    })

    it('upgrades rolled LEGENDARY tier to MYTHICAL and enforces mythical scale', async () => {
      const broadcastMock = vi.fn()
      currentPredictionRow = makeRow({
        equipped_relic: 'architects_keystone'
      })

      // Mock random sequence:
      // 1. Pass bonus chance check.
      // 2. Roll a LEGENDARY bonus.
      let rollIndex = 0
      vi.spyOn(Math, 'random').mockImplementation(() => {
        rollIndex++
        if (rollIndex === 1) return 0.1
        if (rollIndex === 2) return 0.98
        return 0.5
      })

      await predictionService.resolvePrediction('g1', 'Winner', broadcastMock)

      const predUpdate = queriesExecuted.find((q) =>
        q.sql.includes('UPDATE predictions')
      )
      expect(predUpdate).toBeDefined()
      expect(predUpdate!.params[2]).toBe('MYTHICAL')
      expect(predUpdate!.params[3]).toBe(7.0)
    })
  })

  // Kinetic Capacitor Mechanic
  describe('Kinetic Capacitor Mechanic', () => {
    it('fires x2 multiplier and resets counter on the 30th win', async () => {
      const broadcastMock = vi.fn()
      currentPredictionRow = makeRow({
        equipped_relic: 'kinetic_capacitor',
        relic_counter: '29'
      })

      await predictionService.resolvePrediction('g1', 'Winner', broadcastMock)

      const relicUpdate = queriesExecuted.find((q) =>
        q.sql.includes('UPDATE relics SET counter')
      )
      expect(relicUpdate).toBeDefined()
      expect(relicUpdate!.params[0]).toBe(30)

      const predUpdate = queriesExecuted.find((q) =>
        q.sql.includes('UPDATE predictions')
      )
      expect(predUpdate).toBeDefined()
      expect(predUpdate!.params[9]).toBe(2)

      expect(broadcastMock).toHaveBeenCalledWith(
        'prediction_result',
        expect.stringContaining('"kineticFired":true')
      )
    })
  })

  // Festival behavior
  describe('Festival Integrations', () => {
    it('Fever Festival preserves active win streak during LOSE result', async () => {
      const broadcastMock = vi.fn()
      mockActiveFestival.value = { type: 'FEVER' }

      currentPredictionRow = makeRow({
        pick: 'Loser',
        current_win_streak: '5'
      })

      await predictionService.resolvePrediction('g1', 'Winner', broadcastMock)

      const userUpdate = queriesExecuted.find((q) =>
        q.sql.includes('UPDATE users')
      )
      expect(userUpdate).toBeDefined()
      expect(userUpdate!.params[13]).toBe(5)
    })

    it('Resonance Festival clamps EPIC bonus tier down to RARE', async () => {
      const broadcastMock = vi.fn()
      mockActiveFestival.value = { type: 'RESONANCE' }

      // Resonance guarantees a bonus roll.
      // Roll an EPIC bonus to verify the Resonance cap.
      let rollIndex = 0
      vi.spyOn(Math, 'random').mockImplementation(() => {
        rollIndex++
        if (rollIndex === 1) return 0.95
        return 0.5
      })

      await predictionService.resolvePrediction('g1', 'Winner', broadcastMock)

      const predUpdate = queriesExecuted.find((q) =>
        q.sql.includes('UPDATE predictions')
      )
      expect(predUpdate).toBeDefined()
      expect(predUpdate!.params[2]).toBe('RARE')
    })

    it('Safeguard Festival decreases basic loss scaling to 40%', async () => {
      const broadcastMock = vi.fn()
      mockActiveFestival.value = { type: 'SAFEGUARD' }

      currentPredictionRow = makeRow({
        pick: 'Loser',
        bet_amount: '50000',
        current_points: '500000'
      })

      // Fail the bonus roll so only Safeguard modifies the loss.
      let rollIndex = 0
      vi.spyOn(Math, 'random').mockImplementation(() => {
        rollIndex++
        if (rollIndex === 1) return 0.99
        return 0.5
      })

      await predictionService.resolvePrediction('g1', 'Winner', broadcastMock)

      const userUpdate = queriesExecuted.find((q) =>
        q.sql.includes('UPDATE users')
      )
      expect(userUpdate).toBeDefined()
      const lossDelta = BigInt(userUpdate!.params[0] as string)

      expect(lossDelta).toBe(-20000n)
    })
  })

  // Query helpers
  describe('Database Stats and Pagination Queries', () => {
    it('requests user predictions sorting by wins', async () => {
      const result = await predictionService.getPaginatedUserPredictions(
        'u1',
        1,
        10,
        'wins'
      )
      expect(result).toHaveProperty('matches')
      expect(result).toHaveProperty('predictions')
      expect(result.hasMore).toBe(true)

      const matchedQuery = queriesExecuted.find(
        (q) =>
          q.sql.includes("result = 'WIN'") &&
          q.sql.includes('ORDER BY p.gain_loss DESC')
      )
      expect(matchedQuery).toBeDefined()
    })

    it('successfully evaluates and parses detailed user stats', async () => {
      const stats = await predictionService.getUserStats('u1', 'abc123')
      expect(stats.wins).toBe(12)
      expect(stats.losses).toBe(3)
      expect(stats.winRate).toBe(80)
      expect(stats.avgReturn).toBe('30000') // Average return derived from mocked stats.
    })

    it('gathers broad system betting summaries', async () => {
      const globalStats = await predictionService.getGlobalBettingStats()
      expect(globalStats.total_bets).toBe(100)
      expect(globalStats.winning_bets).toBe(60)
      expect(globalStats.total_volume).toBe('5000000')
    })
  })
})
