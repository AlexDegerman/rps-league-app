import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as predictionService from '../../services/predictionService.js'
import pool from '../../utils/db.js'
import { mockDbResponse } from '../setup.js'

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

const mockActiveGlobalEvent: { value: ActiveGlobalEvent | null } = {
  value: null
}
const mockActiveFestival: { value: ActiveFestival | null } = { value: null }
const mockFlashEvent: { value: FlashEvent | null } = { value: null }

vi.mock('../../services/oracleProphecyService.js', () => ({
  hasUserUsedOracle: vi.fn(() => Promise.resolve(true)),
  consumeOracleForUser: vi.fn((userId, client) => {
    const q = client || pool
    return q.query(
      'UPDATE users SET oracle_used_date = $1 WHERE user_id = $2',
      [Date.now(), userId]
    )
  }),
  getOracleState: vi.fn(() => ({ side: 'left' }))
}))

vi.mock('../../services/flashEventService.js', () => ({
  getFlashEventForUser: vi.fn(() => mockFlashEvent.value),
  consumeFlashBetForUser: vi.fn(() => false),
  tryTriggerFlashEventForUser: vi.fn(),
  recordSessionFlashType: vi.fn(),
  hasSeenAllFlashTypes: vi.fn(() => false)
}))

vi.mock('../../services/festivalService.js', () => ({
  checkAndTriggerFestival: vi.fn(),
  getGuaranteedBonusRemaining: vi.fn(() => 0),
  consumeGuaranteedBonus: vi.fn(),
  getActiveFestival: vi.fn(() => mockActiveFestival.value),
  triggerVaultFestival: vi.fn(),
  triggerSafeguardFestival: vi.fn()
}))

vi.mock('../../services/globalEventService.js', () => ({
  applyGlobalEventBuff: vi.fn(
    (isWin: boolean, gainLoss: bigint, _bet: bigint) => ({
      gainLossMultiplied:
        mockActiveGlobalEvent.value?.type === 'SOLAR_FLARE' &&
        mockActiveGlobalEvent.value?.phase === 'active'
          ? gainLoss * 2n
          : gainLoss,
      echoAmount: 0n,
      buffType: mockActiveGlobalEvent.value?.type ?? null,
      echoFactor: 0
    })
  ),
  getActiveGlobalEvent: vi.fn(() => mockActiveGlobalEvent.value)
}))

vi.mock('../../services/relicService.js', () => ({
  RELICS: Array.from({ length: 15 }, (_, i) => ({ key: `relic_${i}` })),
  rollRelicDrop: vi.fn(() => Promise.resolve(null))
}))

vi.mock('../../services/sessionService.js', () => ({
  recordInteraction: vi.fn(() => Promise.resolve())
}))

vi.mock('../../utils/badgeHelper.js', () => ({
  autoEquipUserBadges: vi.fn(() => Promise.resolve())
}))

vi.mock('../../services/worldBossService.js', () => ({
  isWorldBossActive: vi.fn(() => false),
  getCurrentState: vi.fn(() => ({
    hpPct: 100,
    encounterEndsAt: null,
    encounterStartedAt: null
  })),
  registerParticipant: vi.fn(),
  recordMiss: vi.fn(),
  applyDamage: vi.fn()
}))

vi.mock('../../services/bonusStageService.js', () => ({
  rollBonusTrigger: vi.fn(() => null),
  createSession: vi.fn(() => Promise.resolve(null)),
  getActiveSession: vi.fn(() => Promise.resolve(null)),
  getClientInitialData: vi.fn(() => ({}))
}))

vi.mock('../../services/userService.js', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, any>
  return {
    ...actual,
    getOrCreateUser: vi.fn(() =>
      Promise.resolve({ points: 500000n, shortId: 'abc123' })
    )
  }
})

vi.mock('../../utils/logger.js', () => ({
  logger: {
    error: vi.fn(),
    errorWithPoints: vi.fn()
  }
}))

const mockQuery = vi.mocked(pool.query)

let queriesExecuted: Array<ExecutedQuery> = []

const mockClient = {
  query: vi.fn(),
  release: vi.fn()
}

let currentPredictionRow: any
let nicknameCheckRows: any[]
let matchCheckRows: any[]
let currentUserStatsRow: any
let userAchievementsRows: any[]
let userRelicsRows: any[]
let savePredictionRowCount: number

const makeUserReturningRow = (overrides: Record<string, any> = {}) => ({
  wins: '1',
  max_win_streak: '1',
  laps: '0',
  points: '550000',
  biggest_match_mult: '1',
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
  auto_equip_badges: false,
  show_linkedin_badge: false,
  max_streak_during_tidal_surge: '0',
  max_streak_during_cyclone_blitz: '0',
  had_flare_inferno_combo: false,
  had_mirage_high_echo: false,
  had_flash_plus_global_win: false,
  had_dry_mirage: false,
  had_eye_of_storm: false,
  had_prismatic_wave: false,
  had_thermal_fusion: false,
  tidal_surge_participations: '0',
  solar_flare_participations: '0',
  cyclone_blitz_participations: '0',
  mirage_cataclysm_participations: '0',
  global_event_participations: '0',
  displayed_badges: [],
  boss_kills_total: '0',
  hexurion_kills: '0',
  orphion_kills: '0',
  fracturon_kills: '0',
  apexion_kills: '0',
  world_boss_chests_opened: '0',
  had_final_strike: false,
  had_perfect_assault: false,
  had_lucky_shot: false,
  had_clutch_victory: false,
  had_divine_intervention: false,
  ...overrides
})

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

const dispatchQuery = async (sql: string, params: any[] = []): Promise<any> => {
  queriesExecuted.push({ sql, params })

  if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') {
    return mockDbResponse([])
  }

  if (sql.includes('SELECT user_id FROM users WHERE nickname =')) {
    return mockDbResponse(nicknameCheckRows)
  }
  if (
    sql.includes('SELECT expires_at, player_a_name, player_b_name FROM matches')
  ) {
    return mockDbResponse(matchCheckRows)
  }

  if (
    sql.includes('predictions p') &&
    sql.includes('JOIN users u') &&
    sql.includes('JOIN matches m')
  ) {
    return mockDbResponse([currentPredictionRow])
  }

  if (sql.includes('UPDATE relics SET counter')) {
    return mockDbResponse([])
  }
  if (sql.includes('UPDATE predictions') && sql.includes('SET result')) {
    return mockDbResponse([])
  }

  if (sql.includes('UPDATE users') && sql.includes('RETURNING')) {
    return mockDbResponse([currentUserStatsRow])
  }

  if (sql.includes('UPDATE users SET oracle_used_date')) {
    return mockDbResponse([])
  }

  if (sql.includes('SELECT achievement_code FROM user_achievements')) {
    return mockDbResponse(userAchievementsRows)
  }

  if (sql.includes('SELECT relic_key') && sql.includes('FROM relics')) {
    return mockDbResponse(userRelicsRows)
  }

  if (sql.includes('INSERT INTO user_achievements')) {
    return mockDbResponse([])
  }

  if (sql.includes('UPDATE users SET total_achievements')) {
    return mockDbResponse([])
  }

  if (sql.includes('SELECT equipped_relics FROM users')) {
    return mockDbResponse([{ equipped_relics: [] }])
  }

  if (sql.includes('UPDATE users SET nickname')) {
    return mockDbResponse([])
  }
  if (sql.includes('INSERT INTO predictions')) {
    return { rowCount: savePredictionRowCount }
  }

  if (sql.includes('predictions p') && sql.includes('LEFT JOIN matches m')) {
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

  if (sql.includes('total_bets') && sql.includes('total_volume')) {
    return mockDbResponse([
      { total_bets: '100', total_volume: '5000000', winning_bets: '60' }
    ])
  }

  if (sql.includes('COUNT(*)') && sql.includes('predictions')) {
    return mockDbResponse([{ count: '15' }])
  }
  if (
    sql.includes('FROM users u') &&
    sql.includes('LEFT JOIN (') &&
    sql.includes('total_gain')
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
  currentUserStatsRow = makeUserReturningRow()
  userAchievementsRows = []
  userRelicsRows = []
  savePredictionRowCount = 1
  queriesExecuted = []

  mockQuery.mockImplementation(async (sql: any, params?: any) =>
    dispatchQuery(typeof sql === 'string' ? sql : '', params ?? [])
  )

  mockClient.query.mockImplementation(async (sql: any, params?: any) =>
    dispatchQuery(typeof sql === 'string' ? sql : '', params ?? [])
  )
  mockClient.release.mockReturnValue(undefined)

  if (typeof (pool as any).connect !== 'function') {
    ;(pool as any).connect = vi.fn()
  }

  vi.spyOn(pool, 'connect').mockResolvedValue(mockClient as any)
})

describe('Prediction Service', () => {
  describe('Core resolution behaviour', () => {
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

      const updateCall = queriesExecuted.find(
        (q) => q.sql.includes('UPDATE users') && q.sql.includes('RETURNING')
      )
      expect(updateCall).toBeDefined()
      expect(BigInt(updateCall!.params[0])).toBeGreaterThan(0n)
    })

    it('clamps loss so points never drop below POINTS_FLOOR (100k)', async () => {
      const broadcastMock = vi.fn()
      currentPredictionRow = makeRow({
        pick: 'Loser',
        current_points: '120000'
      })

      await predictionService.resolvePrediction('g1', 'Winner', broadcastMock)

      const updateCall = queriesExecuted.find(
        (q) => q.sql.includes('UPDATE users') && q.sql.includes('RETURNING')
      )
      expect(updateCall).toBeDefined()
      const gainLoss = BigInt(updateCall!.params[0] as string)
      expect(120000n + gainLoss).toBeGreaterThanOrEqual(100000n)
    })

    it('emits prediction_result only after COMMIT, not before', async () => {
      const broadcastMock = vi.fn()
      const callOrder: string[] = []

      mockClient.query.mockImplementation(async (sql: any, params?: any) => {
        const sqlStr = typeof sql === 'string' ? sql : ''
        if (sqlStr === 'COMMIT') callOrder.push('COMMIT')
        return dispatchQuery(sqlStr, params ?? [])
      })

      broadcastMock.mockImplementation((event: string) => {
        if (event === 'prediction_result')
          callOrder.push('broadcast:prediction_result')
      })

      await predictionService.resolvePrediction('g1', 'Winner', broadcastMock)

      const commitIdx = callOrder.indexOf('COMMIT')
      const broadcastIdx = callOrder.indexOf('broadcast:prediction_result')
      expect(commitIdx).toBeGreaterThanOrEqual(0)
      expect(broadcastIdx).toBeGreaterThan(commitIdx)
    })

    it('does not emit prediction_result when transaction rolls back', async () => {
      const broadcastMock = vi.fn()

      mockClient.query.mockImplementation(async (sql: any, params?: any) => {
        const sqlStr = typeof sql === 'string' ? sql : ''
        if (sqlStr.includes('UPDATE users') && sqlStr.includes('RETURNING')) {
          throw new Error('simulated DB failure')
        }
        return dispatchQuery(sqlStr, params ?? [])
      })

      await predictionService.resolvePrediction('g1', 'Winner', broadcastMock)

      expect(broadcastMock).not.toHaveBeenCalledWith(
        'prediction_result',
        expect.anything()
      )
    })

    it('rolls back the failing user but still resolves others', async () => {
      const broadcastMock = vi.fn()

      // Verify one failed bettor transaction does not prevent other bettors from resolving
      const rows = [
        makeRow({ user_id: 'u1', nickname: 'Player1' }),
        makeRow({ user_id: 'u2', nickname: 'Player2' })
      ]

      // Return both bettors so their transactions can be tested independently
      let fetchIntercepted = false
      mockQuery.mockImplementation(async (sql: any, params?: any) => {
        const sqlStr = typeof sql === 'string' ? sql : ''
        if (
          !fetchIntercepted &&
          sqlStr.includes('predictions p') &&
          sqlStr.includes('JOIN users u')
        ) {
          fetchIntercepted = true
          queriesExecuted.push({ sql: sqlStr, params: params ?? [] })
          return mockDbResponse(rows)
        }
        return dispatchQuery(sqlStr, params ?? [])
      })

      mockClient.query.mockImplementation(async (sql: any, params?: any) => {
        const sqlStr = typeof sql === 'string' ? sql : ''
        // Identify the u1 transaction from the user_id parameter
        const isU1Tx =
          sqlStr.includes('UPDATE users') &&
          sqlStr.includes('RETURNING') &&
          params?.[1] === 'u1'

        if (isU1Tx) throw new Error('simulated failure for u1')
        return dispatchQuery(sqlStr, params ?? [])
      })

      await predictionService.resolvePrediction('g1', 'Winner', broadcastMock)

      // u2 should have received a result broadcast; u1 should not
      const resultBroadcasts = broadcastMock.mock.calls.filter(
        ([event]) => event === 'prediction_result'
      )
      expect(
        resultBroadcasts.some(([, data]) => data.includes('"userId":"u2"'))
      ).toBe(true)
      expect(
        resultBroadcasts.some(([, data]) => data.includes('"userId":"u1"'))
      ).toBe(false)
    })
  })

  describe('savePrediction validation', () => {
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

  describe("Architect's Keystone", () => {
    it('upgrades rolled COMMON tier to RARE', async () => {
      const broadcastMock = vi.fn()
      currentPredictionRow = makeRow({ equipped_relic: 'architects_keystone' })

      let rollIndex = 0
      vi.spyOn(Math, 'random').mockImplementation(() => {
        rollIndex++
        if (rollIndex === 1) return 0.1
        if (rollIndex === 2) return 0.2
        return 0.5
      })

      await predictionService.resolvePrediction('g1', 'Winner', broadcastMock)

      const predUpdate = queriesExecuted.find(
        (q) =>
          q.sql.includes('UPDATE predictions') && q.sql.includes('SET result')
      )
      expect(predUpdate).toBeDefined()
      expect(predUpdate!.params[2]).toBe('RARE')
    })

    it('upgrades rolled LEGENDARY to MYTHICAL and enforces mythical multiplier', async () => {
      const broadcastMock = vi.fn()
      currentPredictionRow = makeRow({ equipped_relic: 'architects_keystone' })

      let rollIndex = 0
      vi.spyOn(Math, 'random').mockImplementation(() => {
        rollIndex++
        if (rollIndex === 1) return 0.1
        if (rollIndex === 2) return 0.98
        return 0.5
      })

      await predictionService.resolvePrediction('g1', 'Winner', broadcastMock)

      const predUpdate = queriesExecuted.find(
        (q) =>
          q.sql.includes('UPDATE predictions') && q.sql.includes('SET result')
      )
      expect(predUpdate).toBeDefined()
      expect(predUpdate!.params[2]).toBe('MYTHICAL')
      expect(predUpdate!.params[3]).toBe(7.0)
    })
  })

  describe('Kinetic Capacitor', () => {
    it('fires x2 and writes counter=30 on the 30th win', async () => {
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

      const predUpdate = queriesExecuted.find(
        (q) =>
          q.sql.includes('UPDATE predictions') && q.sql.includes('SET result')
      )
      expect(predUpdate).toBeDefined()
      expect(predUpdate!.params[9]).toBe(2)

      expect(broadcastMock).toHaveBeenCalledWith(
        'prediction_result',
        expect.stringContaining('"kineticFired":true')
      )
    })
  })

  describe('Festival integrations', () => {
    it('Fever Festival preserves win streak on LOSE', async () => {
      const broadcastMock = vi.fn()
      mockActiveFestival.value = { type: 'FEVER' }
      currentPredictionRow = makeRow({ pick: 'Loser', current_win_streak: '5' })

      await predictionService.resolvePrediction('g1', 'Winner', broadcastMock)

      const userUpdate = queriesExecuted.find(
        (q) => q.sql.includes('UPDATE users') && q.sql.includes('RETURNING')
      )
      expect(userUpdate).toBeDefined()
      expect(userUpdate!.params[13]).toBe(5)
    })

    it('Resonance Festival clamps EPIC bonus down to RARE', async () => {
      const broadcastMock = vi.fn()
      mockActiveFestival.value = { type: 'RESONANCE' }

      // Resonance forces pityCount=3, guaranteeing the bonus roll
      let rollIndex = 0
      vi.spyOn(Math, 'random').mockImplementation(() => {
        rollIndex++
        if (rollIndex === 1) return 0.95
        return 0.5
      })

      await predictionService.resolvePrediction('g1', 'Winner', broadcastMock)

      const predUpdate = queriesExecuted.find(
        (q) =>
          q.sql.includes('UPDATE predictions') && q.sql.includes('SET result')
      )
      expect(predUpdate).toBeDefined()
      expect(predUpdate!.params[2]).toBe('RARE')
    })

    it('Safeguard Festival reduces base loss to 40% of bet', async () => {
      const broadcastMock = vi.fn()
      mockActiveFestival.value = { type: 'SAFEGUARD' }
      currentPredictionRow = makeRow({
        pick: 'Loser',
        bet_amount: '50000',
        current_points: '500000'
      })

      // Fail the bonus roll so Safeguard is the only loss modifier
      let rollIndex = 0
      vi.spyOn(Math, 'random').mockImplementation(() => {
        rollIndex++
        if (rollIndex === 1) return 0.99
        return 0.5
      })

      await predictionService.resolvePrediction('g1', 'Winner', broadcastMock)

      const userUpdate = queriesExecuted.find(
        (q) => q.sql.includes('UPDATE users') && q.sql.includes('RETURNING')
      )
      expect(userUpdate).toBeDefined()
      expect(BigInt(userUpdate!.params[0] as string)).toBe(-20000n)
    })
  })

  describe('Transaction atomicity', () => {
    it('sends BEGIN and COMMIT for each bettor', async () => {
      await predictionService.resolvePrediction('g1', 'Winner', vi.fn())

      const begins = queriesExecuted.filter((q) => q.sql === 'BEGIN')
      const commits = queriesExecuted.filter((q) => q.sql === 'COMMIT')
      expect(begins).toHaveLength(1)
      expect(commits).toHaveLength(1)
    })

    it('sends ROLLBACK and releases client when UPDATE users throws', async () => {
      mockClient.query.mockImplementation(async (sql: any, params?: any) => {
        const sqlStr = typeof sql === 'string' ? sql : ''
        if (sqlStr.includes('UPDATE users') && sqlStr.includes('RETURNING')) {
          throw new Error('simulated failure')
        }
        return dispatchQuery(sqlStr, params ?? [])
      })

      await predictionService.resolvePrediction('g1', 'Winner', vi.fn())

      const rollbacks = queriesExecuted.filter((q) => q.sql === 'ROLLBACK')
      expect(rollbacks).toHaveLength(1)
      expect(mockClient.release).toHaveBeenCalled()
    })

    it('oracle charge (UPDATE oracle_used_date) is inside the transaction', async () => {
      // Verify the Oracle charge occurs inside the resolution transaction
      const { hasUserUsedOracle } =
        await import('../../services/oracleProphecyService.js')
      vi.mocked(hasUserUsedOracle).mockResolvedValue(false)

      // Activate the Oracle prediction path
      const { getOracleState } =
        await import('../../services/oracleProphecyService.js')
      vi.mocked(getOracleState).mockReturnValue({ side: 'left' } as any)
      currentPredictionRow = makeRow({
        pick: 'Winner',
        player_a_name: 'Winner'
      })

      const txQueryOrder: string[] = []
      let insideTx = false

      mockClient.query.mockImplementation(async (sql: any, params?: any) => {
        const sqlStr = typeof sql === 'string' ? sql : ''
        if (sqlStr === 'BEGIN') insideTx = true
        if (sqlStr === 'COMMIT' || sqlStr === 'ROLLBACK') insideTx = false
        if (insideTx) txQueryOrder.push(sqlStr.trim().split('\n')[0] ?? '')
        return dispatchQuery(sqlStr, params ?? [])
      })

      await predictionService.resolvePrediction('g1', 'Winner', vi.fn())

      const oracleUpdate = txQueryOrder.find((s) =>
        s.includes('UPDATE users SET oracle_used_date')
      )
      expect(oracleUpdate).toBeDefined()
    })
  })

  describe('Database stats and pagination', () => {
    it('requests user predictions sorted by wins', async () => {
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

    it('parses detailed user stats correctly', async () => {
      const stats = await predictionService.getUserStats('u1', 'abc123')
      expect(stats.wins).toBe(12)
      expect(stats.losses).toBe(3)
      expect(stats.winRate).toBe(80)
      expect(stats.avgReturn).toBe('30000')
    })

    it('returns global betting summary', async () => {
      const globalStats = await predictionService.getGlobalBettingStats()
      expect(globalStats.total_bets).toBe(100)
      expect(globalStats.winning_bets).toBe(60)
      expect(globalStats.total_volume).toBe('5000000')
    })
  })
})
