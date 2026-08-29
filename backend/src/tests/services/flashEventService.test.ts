import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import pool from '../../utils/db.js'

vi.mock('../../utils/db.js', () => ({
  default: {
    query: vi.fn()
  }
}))

vi.mock('../../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}))

vi.mock('../../services/worldBossService.js', () => ({
  isWorldBossActive: vi.fn(() => false)
}))

describe('Flash Event Service', () => {
  let flashEventService: any
  let firstFlashTriggered = true

  beforeEach(async () => {
    vi.resetModules()
    flashEventService = await import('../../services/flashEventService.js')
    firstFlashTriggered = true

    const mockQuery = pool.query as any
    mockQuery.mockImplementation(async (sql: string, params?: any[]) => {
      if (sql.includes('SELECT nickname, first_flash_triggered')) {
        return {
          rows: [
            {
              nickname: 'TestUser',
              first_flash_triggered: firstFlashTriggered
            }
          ]
        }
      }
      if (sql.includes('SELECT user_id, equipped_relic')) {
        return {
          rows: [
            {
              user_id: 'user123',
              equipped_relic: params?.[0] || null
            }
          ]
        }
      }
      return { rows: [] }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('triggers an event and broadcasts the correct payload', async () => {
    const broadcastMock = vi.fn() as any
    vi.spyOn(Math, 'random').mockReturnValue(0.01)

    await flashEventService.tryTriggerFlashEventForUser(
      'user123',
      broadcastMock,
      null
    )

    expect(broadcastMock).toHaveBeenCalledTimes(1)
    const calls = broadcastMock.mock.calls[0] as [string, string]
    expect(calls[0]).toBe('flash_event')

    const payload = JSON.parse(calls[1])
    expect(payload.userId).toBe('user123')
    expect(payload.betsRemaining).toBe(3)
    expect(payload.multiplier).toBeGreaterThan(0)
    expect(payload.type).toBeDefined()

    const activeEvent = flashEventService.getFlashEventForUser('user123')
    expect(activeEvent).not.toBeNull()
    expect(activeEvent?.type).toBe(payload.type)
  })

  it('first flash uses the first-time trigger behavior', async () => {
    const broadcastMock = vi.fn() as any
    firstFlashTriggered = false
    vi.spyOn(Math, 'random').mockReturnValue(0.15)

    const querySpy = vi.spyOn(pool, 'query')

    await flashEventService.tryTriggerFlashEventForUser(
      'user123',
      broadcastMock,
      null
    )

    expect(broadcastMock).toHaveBeenCalledTimes(1)
    expect(querySpy).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE users SET first_flash_triggered = true'),
      ['user123']
    )
  })

  it('relic modifiers correctly affect trigger/bet count', async () => {
    const broadcastMock = vi.fn() as any
    firstFlashTriggered = true
    vi.spyOn(Math, 'random').mockReturnValue(0.18)

    await flashEventService.tryTriggerFlashEventForUser(
      'user123',
      broadcastMock,
      'cobalt_core'
    )
    expect(broadcastMock).toHaveBeenCalledTimes(1)

    while (!flashEventService.consumeFlashBetForUser('user123')) {}

    broadcastMock.mockClear()
    vi.spyOn(Math, 'random').mockReturnValue(0.01)

    await flashEventService.tryTriggerFlashEventForUser(
      'user123',
      broadcastMock,
      'temporal_anchor'
    )
    expect(broadcastMock).toHaveBeenCalledTimes(1)

    const calls = broadcastMock.mock.calls[0] as [string, string]
    const payload = JSON.parse(calls[1])
    expect(payload.betsRemaining).toBe(4)
  })

  it('consuming bets removes the event after the final bet', async () => {
    const broadcastMock = vi.fn() as any
    vi.spyOn(Math, 'random').mockReturnValue(0.01)

    await flashEventService.tryTriggerFlashEventForUser(
      'user123',
      broadcastMock,
      null
    )

    const initialEvent = flashEventService.getFlashEventForUser('user123')
    expect(initialEvent).not.toBeNull()

    const end1 = flashEventService.consumeFlashBetForUser('user123')
    expect(end1).toBe(false)
    expect(
      flashEventService.getFlashEventForUser('user123')?.betsRemaining
    ).toBe(2)

    const end2 = flashEventService.consumeFlashBetForUser('user123')
    expect(end2).toBe(false)
    expect(
      flashEventService.getFlashEventForUser('user123')?.betsRemaining
    ).toBe(1)

    const end3 = flashEventService.consumeFlashBetForUser('user123')
    expect(end3).toBe(true)
    expect(flashEventService.getFlashEventForUser('user123')).toBeNull()
  })

  it('expired events are no longer returned', async () => {
    vi.useFakeTimers()

    const mockQuery = pool.query as any
    mockQuery.mockResolvedValueOnce({
      rows: [{ user_id: 'user123', equipped_relic: null }]
    })

    await flashEventService.refillAllFlashEvents('LUNAR')

    const initialEvent = flashEventService.getFlashEventForUser('user123')
    expect(initialEvent).not.toBeNull()
    expect(initialEvent?.expiresAt).toBeDefined()

    vi.advanceTimersByTime(50000)

    const expiredEvent = flashEventService.getFlashEventForUser('user123')
    expect(expiredEvent).toBeNull()
  })
})
