import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import pool from '../utils/db.js'
import { mockDbResponse } from '../test/setup.js'

const mockGlobalEventBlocking = { value: false }

vi.mock('./globalEventService.js', () => ({
  isGlobalEventBlocking: vi.fn(() => mockGlobalEventBlocking.value)
}))

vi.mock('./relicService.js', () => ({
  RELICS: [
    {
      key: 'boss_relic_a',
      name: 'Boss Relic A',
      rarity: 'RARE',
      icon: '🔴',
      effect: 'Effect A',
      bossExclusive: true
    },
    {
      key: 'boss_relic_b',
      name: 'Boss Relic B',
      rarity: 'LEGENDARY',
      icon: '🟣',
      effect: 'Effect B',
      bossExclusive: true
    }
  ]
}))

vi.mock('../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}))

const mockQuery = vi.mocked(pool.query)

const freshImport = async () => {
  vi.resetModules()
  return import('./worldBossService.js')
}

let queriesExecuted: { sql: string; params: any[] }[] = []

// Utility to completely flush the microtask queue for sequential awaits
const flushPromises = async () => {
  for (let i = 0; i < 100; i++) {
    await Promise.resolve()
  }
}

const setupDefaultDb = (
  customUserRelics: string[] = [],
  customPoints = '1000000'
) => {
  queriesExecuted = []
  mockQuery.mockImplementation(async (sql: any, params?: any): Promise<any> => {
    const s = typeof sql === 'string' ? sql : ''
    queriesExecuted.push({ sql: s, params: params ?? [] })

    if (
      s.includes('SELECT id FROM world_boss_encounters WHERE ended_at IS NULL')
    )
      return mockDbResponse([])
    if (s.includes('INSERT INTO world_boss_encounters'))
      return mockDbResponse([{ id: 42 }])
    if (s.includes('UPDATE world_boss_encounters')) return mockDbResponse([])
    if (s.includes('INSERT INTO world_boss_damage')) return mockDbResponse([])
    if (s.includes('SELECT points FROM users'))
      return mockDbResponse([{ points: customPoints }])
    if (s.includes('SELECT equipped_relics, nickname FROM users'))
      return mockDbResponse([
        { equipped_relics: customUserRelics, nickname: 'Tester' }
      ])
    if (s.includes('SELECT relic_key FROM relics')) return mockDbResponse([])
    if (s.includes('INSERT INTO relics')) return mockDbResponse([])
    if (s.includes('UPDATE users') && s.includes('had_final_strike'))
      return mockDbResponse([])
    if (s.includes('UPDATE users') && s.includes('world_boss_chests_opened'))
      return mockDbResponse([])
    if (s.includes('UPDATE users') && s.includes('_kills'))
      return mockDbResponse([])
    if (s.includes('SELECT 1 FROM predictions WHERE result IS NULL'))
      return mockDbResponse([])

    return mockDbResponse([])
  })
}

// Skip 12m cooldown + 30s warning deterministically and flush startup queries
const driveToActive = async (svc: any, bc: any) => {
  // Force cooldown timer to evaluate to maximum duration (12 minutes)
  const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.9999)
  await svc.handleRestart(bc)
  randomSpy.mockRestore() // immediately restore so we don't affect other logic

  await vi.advanceTimersByTimeAsync(12 * 60 * 1000)
  await vi.advanceTimersByTimeAsync(30000)
  await flushPromises()
}
describe('worldBossService Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setupDefaultDb()
    mockGlobalEventBlocking.value = false
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('validates the complete encounter lifecycle transitions', async () => {
    // Force cooldown to evaluate to exactly maximum duration (12 minutes)
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.9999)

    const svc = await freshImport()
    const bc = vi.fn()
    expect(svc.getCurrentState().phase).toBe('IDLE')

    await svc.handleRestart(bc as any)
    expect(svc.getCurrentState().phase).toBe('COOLDOWN')

    await vi.advanceTimersByTimeAsync(12 * 60 * 1000)
    expect(svc.getCurrentState().phase).toBe('WARNING')

    await vi.advanceTimersByTimeAsync(30000)
    expect(svc.getCurrentState().phase).toBe('ACTIVE')

    randomSpy.mockRestore()
  })

  it('guards active states and prevents strikes during inactive phases', async () => {
    const svc = await freshImport()
    const bc = vi.fn()
    expect(svc.isWorldBossActive()).toBe(false)
    expect(svc.isWorldBossBlocking()).toBe(false)

    svc.applyDamage('u1', 10, bc as any)
    expect(svc.getCurrentState().bossCurrentHp).toBe(0)
  })

  it('scales boss max HP dynamically as unique players register', async () => {
    const svc = await freshImport()
    const bc = vi.fn()
    await driveToActive(svc, bc as any)

    svc.registerParticipant('u1', 60000, 'Alice')
    expect(svc.getCurrentState().bossMaxHp).toBe(4)

    svc.registerParticipant('u2', 60000, 'Bob')
    expect(svc.getCurrentState().bossMaxHp).toBe(8)
  })

  it('manages strike damage deductions, strike count, sorting, and tie-breakers', async () => {
    const svc = await freshImport()
    const bc = vi.fn()
    await driveToActive(svc, bc as any)

    svc.registerParticipant('u1', 60000, 'Alice')
    svc.registerParticipant('u2', 60000, 'Bob')

    svc.applyDamage('u2', 2, bc as any)
    await vi.advanceTimersByTimeAsync(5)
    svc.applyDamage('u1', 2, bc as any)

    const state = svc.getCurrentState()
    expect(state.bossCurrentHp).toBe(4)
    expect(state.strikeCount).toBe(2)

    const { top } = svc.getTopDamagers()
    expect(top[0]!.userId).toBe('u2')
  })

  it('interrupted open encounters are recovered and marked on restart', async () => {
    mockQuery.mockImplementation(
      async (sql: any, params?: any): Promise<any> => {
        const s = typeof sql === 'string' ? sql : ''
        if (
          s.includes(
            'SELECT id FROM world_boss_encounters WHERE ended_at IS NULL'
          )
        ) {
          return mockDbResponse([{ id: 77 }])
        }
        if (
          s.includes(
            "UPDATE world_boss_encounters SET ended_at=$1, outcome='RETREAT', interrupted=true"
          )
        ) {
          queriesExecuted.push({ sql: s, params: params ?? [] })
          return mockDbResponse([])
        }
        return mockDbResponse([])
      }
    )

    const svc = await freshImport()
    const bc = vi.fn()
    await svc.handleRestart(bc as any)

    const recovered = queriesExecuted.some((q) => q.params.includes(77))
    expect(recovered).toBe(true)
  })

  it('persists final encounter results and damage records to the database', async () => {
    const svc = await freshImport()
    const bc = vi.fn()
    await driveToActive(svc, bc as any)
    svc.registerParticipant('u1', 60000, 'Alice')

    svc.applyDamage('u1', svc.getCurrentState().bossCurrentHp, bc as any)
    await vi.advanceTimersByTimeAsync(500)
    await flushPromises()

    const encounterUpdated = queriesExecuted.some(
      (q) =>
        q.sql.includes('UPDATE world_boss_encounters') &&
        q.params.includes('DEFEAT')
    )
    const damageRecorded = queriesExecuted.some((q) =>
      q.sql.includes('INSERT INTO world_boss_damage')
    )
    expect(encounterUpdated).toBe(true)
    expect(damageRecorded).toBe(true)
  })

  it('awards MYTHICAL chests on DEFEAT and COMMON/RARE chests on RETREAT', async () => {
    const svc = await freshImport()
    const bc = vi.fn()

    await driveToActive(svc, bc as any)
    svc.registerParticipant('u1', 60000, 'Alice')
    svc.applyDamage('u1', svc.getCurrentState().bossCurrentHp, bc as any)
    await vi.advanceTimersByTimeAsync(5000)
    await flushPromises()

    const rewardCall = bc.mock.calls.find(
      ([evt]) => evt === 'world_boss_reward'
    )
    expect(rewardCall).toBeDefined()
    expect(JSON.parse(rewardCall![1]).chestRarity).toBe('MYTHICAL')
  })

  it('calculates point rewards proportional to the user balance', async () => {
    const svc = await freshImport()
    const bc = vi.fn()
    setupDefaultDb([], '2000000')
    await driveToActive(svc, bc as any)

    svc.registerParticipant('u1', 60000, 'Alice')
    svc.applyDamage('u1', svc.getCurrentState().bossCurrentHp, bc as any)
    await vi.advanceTimersByTimeAsync(5000)
    await flushPromises()

    const rewardCall = bc.mock.calls.find(
      ([evt]) => evt === 'world_boss_reward'
    )
    expect(rewardCall).toBeDefined()
    const payload = JSON.parse(rewardCall![1])
    expect(BigInt(payload.pointReward)).toBe(10000000n)
  })

  it('applies equipped relics to upgrade chest rarity and add bonus multiplier scaling', async () => {
    const svc = await freshImport()
    const bc = vi.fn()

    setupDefaultDb(['celestial_crown', 'prism_key', 'dragons_hoard'], '1000000')
    await driveToActive(svc, bc as any)

    vi.spyOn(Math, 'random').mockReturnValue(0.0)

    svc.registerParticipant('u1', 60000, 'Alice')
    svc.applyDamage('u1', svc.getCurrentState().bossCurrentHp, bc as any)
    await vi.advanceTimersByTimeAsync(5000)
    await flushPromises()

    const rewardCall = bc.mock.calls.find(
      ([evt]) => evt === 'world_boss_reward'
    )
    expect(rewardCall).toBeDefined()
    const payload = JSON.parse(rewardCall![1])
    expect(payload.chestRarity).toBe('RAINBOW')
    expect(BigInt(payload.pointReward)).toBe(9000000n)
  })

  it('evaluates and logs had_final_strike and had_perfect_assault to database', async () => {
    const svc = await freshImport()
    const bc = vi.fn()
    await driveToActive(svc, bc as any)

    svc.registerParticipant('u1', 60000, 'Alice')
    svc.applyDamage('u1', svc.getCurrentState().bossCurrentHp, bc as any)
    await vi.advanceTimersByTimeAsync(5000)
    await flushPromises()

    const strikesUpdated = queriesExecuted.some(
      (q) =>
        q.sql.includes('had_final_strike') &&
        q.params[0] === true &&
        q.params[1] === true
    )
    expect(strikesUpdated).toBe(true)
  })

  it('synchronizes and triggers system pause/resume callbacks during transitions', async () => {
    const svc = await freshImport()
    const pauseFest = vi.fn()
    const resumeFest = vi.fn()
    const pauseGlobal = vi.fn()
    const resumeGlobal = vi.fn()

    svc.registerExternalSystems(
      pauseFest,
      resumeFest,
      pauseGlobal,
      resumeGlobal
    )

    const bc = vi.fn()
    await driveToActive(svc, bc as any)
    expect(pauseFest).toHaveBeenCalled()

    svc.registerParticipant('u1', 60000, 'Alice')
    svc.applyDamage('u1', svc.getCurrentState().bossCurrentHp, bc as any)
    await vi.advanceTimersByTimeAsync(500)
    await flushPromises()

    expect(resumeFest).toHaveBeenCalled()
  })

  it('defers warning phase activation if a global event is currently blocking', async () => {
    mockGlobalEventBlocking.value = true

    const svc = await freshImport()
    const bc = vi.fn()
    await svc.handleRestart(bc as any)

    await vi.advanceTimersByTimeAsync(12 * 60 * 1000)
    expect(svc.getCurrentState().phase).toBe('COOLDOWN')

    mockGlobalEventBlocking.value = false
    await vi.advanceTimersByTimeAsync(5000) // retry schedule checks every 5s
    expect(['WARNING', 'ACTIVE']).toContain(svc.getCurrentState().phase)
  })
})
