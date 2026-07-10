import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Control the scheduler's perceived time.
const INITIAL_SYSTEM_TIME = new Date('2026-04-02T10:00:00Z').getTime()

// Mock DB module to isolate tests from persistent state.
vi.mock('../utils/db.js', () => ({
  default: {
    query: vi.fn().mockResolvedValue({ rows: [] })
  }
}))

// Mock logger to suppress test noise.
vi.mock('../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}))

// Mock flash event service dependencies.
vi.mock('./flashEventService.js', () => ({
  clearAllFlashEvents: vi.fn().mockResolvedValue(undefined),
  getRandomFlashType: vi.fn().mockReturnValue({ type: 'CARDS' }),
  refillAllFlashEvents: vi.fn().mockResolvedValue(undefined)
}))

describe('Festival Service', () => {
  let festivalService: typeof import('./festivalService.js')

  beforeEach(async () => {
    // Reset module state between tests because tracker states persist in the module cache.
    vi.resetModules()
    festivalService = await import('./festivalService.js')
    vi.useFakeTimers()
    vi.setSystemTime(INITIAL_SYSTEM_TIME)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.clearAllTimers()
  })

  describe('Module State Initialization', () => {
    it('should start with default config states and no active festival', () => {
      expect(festivalService.getActiveFestival()).toBeNull()
      expect(festivalService.getFestivalLockoutRemaining()).toBe(0)
      expect(festivalService.isFestivalLocked()).toBe(false)
      expect(festivalService.areFestivalsEnabled()).toBe(true)
    })

    it('should honor configuration state overrides when disabled', () => {
      festivalService.setFestivalsEnabled(false)
      expect(festivalService.areFestivalsEnabled()).toBe(false)
    })
  })

  describe('Message & Speech Format Builders', () => {
    it('should generate oracle template prefixes for demo festivals', () => {
      const message = festivalService.buildFestivalBroadcastMessage(
        'Oracle',
        'GHOST',
        true
      )
      const speech = festivalService.buildFestivalSpeech(
        'Oracle',
        'GHOST',
        true
      )

      expect(message).toContain('FESTIVAL')
      expect(message).not.toContain('{user}')
      expect(speech).toBe(
        'The Oracle System... manifests... GHOST... Festival.'
      )
    })

    it('should generate user templates for standard player festivals', () => {
      const message = festivalService.buildFestivalBroadcastMessage(
        'PlayerOne',
        'FEVER',
        false
      )
      const speech = festivalService.buildFestivalSpeech(
        'PlayerOne',
        'FEVER',
        false
      )

      expect(message).toContain('PlayerOne')
      expect(message).toContain('FEVER FESTIVAL')
      expect(speech).toBe(
        'The catalyst... PlayerOne... invokes... FEVER... Festival.'
      )
    })

    it('should fallback to custom templates for surge festivals', () => {
      const message = festivalService.buildFestivalBroadcastMessage(
        'PlayerOne',
        'SURGE',
        false,
        3
      )
      const speech = festivalService.buildFestivalSpeech(
        'PlayerOne',
        'SURGE',
        false,
        3
      )

      expect(message).toBe(
        'PlayerOne has completed Chrono-Lap 3 and initiated the SURGE FESTIVAL'
      )
      expect(speech).toBe(
        'PlayerOne... ascends... lap... 3... Surge... Festival... unleashed.'
      )
    })
  })

  describe('User Trackers & Streak Metrics', () => {
    const userId = 'user_001'

    it('should process user loss streaks up to bounds', () => {
      expect(festivalService.getLossStreakForUser(userId)).toBe(0)

      festivalService.recordLossForUser(userId)
      festivalService.recordLossForUser(userId)
      expect(festivalService.getLossStreakForUser(userId)).toBe(2)

      festivalService.resetLossStreakForUser(userId)
      expect(festivalService.getLossStreakForUser(userId)).toBe(0)
    })

    it('should manage bonus tier streaks with reset handling on null results', () => {
      festivalService.recordBonusForUser(userId, 'RARE')
      festivalService.recordBonusForUser(userId, 'EPIC')
      expect(festivalService.getBonusStreakForUser(userId)).toBe(2)

      festivalService.recordBonusForUser(userId, null)
      expect(festivalService.getBonusStreakForUser(userId)).toBe(0)
    })

    it('should manage user flash streaks', () => {
      festivalService.recordFlashEventForUser(userId)
      expect(festivalService.getFlashStreakForUser(userId)).toBe(1)

      festivalService.resetFlashStreakForUser(userId)
      expect(festivalService.getFlashStreakForUser(userId)).toBe(0)
    })

    it('should manage guaranteed bonus allocations and counts', () => {
      expect(festivalService.getGuaranteedBonusRemaining(userId)).toBe(0)
      expect(festivalService.consumeGuaranteedBonus(userId)).toBe(false)
    })
  })

  describe('Manual & Lifecyle Triggers', () => {
    it('should correctly increment database metric for player-triggered non-demo events', async () => {
      const db = await import('../utils/db.js')
      const querySpy = vi.spyOn(db.default, 'query')
      const broadcastMock = vi.fn()

      const success = festivalService.triggerVaultFestival(
        'PlayerOne',
        'user_001',
        broadcastMock
      )

      expect(success).toBe(true)
      expect(querySpy).toHaveBeenCalledTimes(1)
      expect(querySpy).toHaveBeenLastCalledWith(
        expect.stringContaining(
          'UPDATE users SET festivals_triggered = festivals_triggered + 1 WHERE user_id = $1'
        ),
        ['user_001']
      )
    })

    it('should support triggerSurgeFestival execution flow', () => {
      const broadcastMock = vi.fn()
      const success = festivalService.triggerSurgeFestival(
        'PlayerOne',
        'user_001',
        5,
        broadcastMock
      )

      expect(success).toBe(true)
      expect(broadcastMock).toHaveBeenCalledTimes(1)
      const data = JSON.parse(broadcastMock.mock.calls[0]![1])
      expect(data.type).toBe('SURGE')
      expect(data.message).toContain('Chrono-Lap 5')
    })

    it('should enforce lockouts immediately after active durations expire', () => {
      const broadcastMock = vi.fn()
      festivalService.triggerSafeguardFestival(
        'PlayerOne',
        'user_001',
        broadcastMock
      )

      // SAFEGUARD has a duration of 60 seconds (60_000ms).
      // Advance past active window but within the 5-minute lockout period.
      vi.advanceTimersByTime(61_000)

      expect(festivalService.getActiveFestival()).toBeNull()
      expect(festivalService.isFestivalLocked()).toBe(true)
      expect(festivalService.getFestivalLockoutRemaining()).toBeGreaterThan(0)

      // Advance past lockout limit.
      vi.advanceTimersByTime(5 * 60 * 1000)
      expect(festivalService.isFestivalLocked()).toBe(false)
      expect(festivalService.getFestivalLockoutRemaining()).toBe(0)
    })
  })

  describe('Check and Trigger Festival Rules', () => {
    const userId = 'user_001'
    const nickname = 'PlayerOne'

    describe('SPARK Festival', () => {
      it('should trigger SPARK and grant guaranteed bonuses after a 2-flash streak', async () => {
        const broadcastMock = vi.fn()

        festivalService.recordFlashEventForUser(userId)
        festivalService.recordFlashEventForUser(userId)

        festivalService.checkAndTriggerFestival(
          userId,
          nickname,
          {
            isWin: true,
            bonusTier: null,
            bonusMult: 0,
            flashActive: false,
            flashJustEnded: true,
            winStreakAfter: 0,
            totalMultiplier: 0,
            flashType: null
          },
          broadcastMock
        )

        await vi.runAllTimersAsync()

        expect(broadcastMock).toHaveBeenCalledTimes(1)
        const payload = JSON.parse(broadcastMock.mock.calls[0]![1])
        expect(payload.type).toBe('SPARK')
        expect(festivalService.getGuaranteedBonusRemaining(userId)).toBe(3)

        // Verify remaining allocations decrement.
        expect(festivalService.consumeGuaranteedBonus(userId)).toBe(true)
        expect(festivalService.getGuaranteedBonusRemaining(userId)).toBe(2)
      })

      it('should trigger SPARK when achieving a high-tier bonus during active non-cards flash', async () => {
        const broadcastMock = vi.fn()

        festivalService.checkAndTriggerFestival(
          userId,
          nickname,
          {
            isWin: true,
            bonusTier: 'MYTHICAL',
            bonusMult: 0,
            flashActive: true,
            flashJustEnded: false,
            winStreakAfter: 0,
            totalMultiplier: 0,
            flashType: 'COOLDOWN' // Any non-cards value
          },
          broadcastMock
        )

        await vi.runAllTimersAsync()

        expect(broadcastMock).toHaveBeenCalledTimes(1)
        const payload = JSON.parse(broadcastMock.mock.calls[0]![1])
        expect(payload.type).toBe('SPARK')
      })

      it('should execute fallback logic cleanly if refilling flash events fails', async () => {
        const flashService = await import('./flashEventService.js')
        vi.spyOn(flashService, 'refillAllFlashEvents').mockRejectedValueOnce(
          new Error('Mock Refill Error')
        )

        const broadcastMock = vi.fn()
        festivalService.recordFlashEventForUser(userId)
        festivalService.recordFlashEventForUser(userId)

        festivalService.checkAndTriggerFestival(
          userId,
          nickname,
          {
            isWin: true,
            bonusTier: null,
            bonusMult: 0,
            flashActive: false,
            flashJustEnded: true,
            winStreakAfter: 0,
            totalMultiplier: 0,
            flashType: null
          },
          broadcastMock
        )

        await vi.runAllTimersAsync()

        expect(broadcastMock).toHaveBeenCalledTimes(1)
        const payload = JSON.parse(broadcastMock.mock.calls[0]![1])
        expect(payload.type).toBe('SPARK')
      })
    })

    describe('GHOST Festival', () => {
      it('should trigger GHOST instantly on a multiplier win of 60x or higher', () => {
        const broadcastMock = vi.fn()

        festivalService.checkAndTriggerFestival(
          userId,
          nickname,
          {
            isWin: true,
            bonusTier: null,
            bonusMult: 0,
            flashActive: false,
            flashJustEnded: false,
            winStreakAfter: 0,
            totalMultiplier: 60,
            flashType: null
          },
          broadcastMock
        )

        expect(broadcastMock).toHaveBeenCalledTimes(1)
        const payload = JSON.parse(broadcastMock.mock.calls[0]![1])
        expect(payload.type).toBe('GHOST')
      })

      it('should evaluate probability bounds for GHOST on 30x+ multiplier wins', () => {
        const broadcastMock = vi.fn()
        const randomSpy = vi.spyOn(Math, 'random')

        // First test: roll succeeds (< 0.40)
        randomSpy.mockReturnValueOnce(0.39)
        festivalService.checkAndTriggerFestival(
          userId,
          nickname,
          {
            isWin: true,
            bonusTier: null,
            bonusMult: 0,
            flashActive: false,
            flashJustEnded: false,
            winStreakAfter: 0,
            totalMultiplier: 30,
            flashType: null
          },
          broadcastMock
        )
        expect(broadcastMock).toHaveBeenCalledTimes(1)

        // Advance time to reset scheduler state before next assertion.
        vi.advanceTimersByTime(60_000 + 5 * 60 * 1000)
        broadcastMock.mockClear()

        // Second test: roll fails (>= 0.40)
        randomSpy.mockReturnValueOnce(0.4)
        festivalService.checkAndTriggerFestival(
          userId,
          nickname,
          {
            isWin: true,
            bonusTier: null,
            bonusMult: 0,
            flashActive: false,
            flashJustEnded: false,
            winStreakAfter: 0,
            totalMultiplier: 30,
            flashType: null
          },
          broadcastMock
        )
        expect(broadcastMock).not.toHaveBeenCalled()
      })
    })

    describe('FEVER Festival', () => {
      it('should enforce strict trigger limits across consecutive wins within the same streak', () => {
        const broadcastMock = vi.fn()

        // Achieve a win streak of 8 to launch FEVER
        festivalService.checkAndTriggerFestival(
          userId,
          nickname,
          {
            isWin: true,
            bonusTier: null,
            bonusMult: 0,
            flashActive: false,
            flashJustEnded: false,
            winStreakAfter: 8,
            totalMultiplier: 1,
            flashType: null
          },
          broadcastMock
        )

        expect(broadcastMock).toHaveBeenCalledTimes(1)

        // Advance time to allow festival state and lockout window to expire.
        vi.advanceTimersByTime(30_000 + 5 * 60 * 1000)
        broadcastMock.mockClear()

        // Increment same continuous streak to 9. It should not fire again.
        festivalService.checkAndTriggerFestival(
          userId,
          nickname,
          {
            isWin: true,
            bonusTier: null,
            bonusMult: 0,
            flashActive: false,
            flashJustEnded: false,
            winStreakAfter: 9,
            totalMultiplier: 1,
            flashType: null
          },
          broadcastMock
        )

        expect(broadcastMock).not.toHaveBeenCalled()

        // Reset streak state by simulating a loss.
        festivalService.checkAndTriggerFestival(
          userId,
          nickname,
          {
            isWin: false,
            bonusTier: null,
            bonusMult: 0,
            flashActive: false,
            flashJustEnded: false,
            winStreakAfter: 0,
            totalMultiplier: 0,
            flashType: null
          },
          broadcastMock
        )

        // Accumulate back to 8 on a new streak. It should succeed.
        festivalService.checkAndTriggerFestival(
          userId,
          nickname,
          {
            isWin: true,
            bonusTier: null,
            bonusMult: 0,
            flashActive: false,
            flashJustEnded: false,
            winStreakAfter: 8,
            totalMultiplier: 1,
            flashType: null
          },
          broadcastMock
        )

        expect(broadcastMock).toHaveBeenCalledTimes(1)
      })

      it('should support random selection bounds for 5-win streaks', () => {
        const broadcastMock = vi.fn()
        const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.19) // < 0.20

        festivalService.checkAndTriggerFestival(
          userId,
          nickname,
          {
            isWin: true,
            bonusTier: null,
            bonusMult: 0,
            flashActive: false,
            flashJustEnded: false,
            winStreakAfter: 5,
            totalMultiplier: 1,
            flashType: null
          },
          broadcastMock
        )

        expect(broadcastMock).toHaveBeenCalledTimes(1)
        expect(JSON.parse(broadcastMock.mock.calls[0]![1]).type).toBe('FEVER')
        randomSpy.mockRestore()
      })
    })

    describe('SANGUINE Festival', () => {
      it('should trigger SANGUINE on the fourth consecutive loss', () => {
        const broadcastMock = vi.fn()

        festivalService.recordLossForUser(userId)
        festivalService.recordLossForUser(userId)
        festivalService.recordLossForUser(userId)

        festivalService.checkAndTriggerFestival(
          userId,
          nickname,
          {
            isWin: false,
            bonusTier: null,
            bonusMult: 0,
            flashActive: false,
            flashJustEnded: false,
            winStreakAfter: 0,
            totalMultiplier: 0,
            flashType: null
          },
          broadcastMock
        )

        expect(broadcastMock).toHaveBeenCalledTimes(1)
        const payload = JSON.parse(broadcastMock.mock.calls[0]![1])
        expect(payload.type).toBe('SANGUINE')
        expect(festivalService.getLossStreakForUser(userId)).toBe(0)
      })
    })

    describe('RESONANCE Festival', () => {
      it('should trigger RESONANCE on the third consecutive tiered bonus', () => {
        const broadcastMock = vi.fn()

        festivalService.recordBonusForUser(userId, 'COMMON')
        festivalService.recordBonusForUser(userId, 'RARE')

        festivalService.checkAndTriggerFestival(
          userId,
          nickname,
          {
            isWin: true,
            bonusTier: 'EPIC',
            bonusMult: 0,
            flashActive: false,
            flashJustEnded: false,
            winStreakAfter: 1,
            totalMultiplier: 1,
            flashType: null
          },
          broadcastMock
        )

        expect(broadcastMock).toHaveBeenCalledTimes(1)
        const payload = JSON.parse(broadcastMock.mock.calls[0]![1])
        expect(payload.type).toBe('RESONANCE')
        expect(festivalService.getBonusStreakForUser(userId)).toBe(0)
      })

      it('should trigger RESONANCE dynamically on LEGENDARY tier bonuses', () => {
        const broadcastMock = vi.fn()
        const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.29) // < 0.30

        festivalService.checkAndTriggerFestival(
          userId,
          nickname,
          {
            isWin: true,
            bonusTier: 'LEGENDARY',
            bonusMult: 0,
            flashActive: false,
            flashJustEnded: false,
            winStreakAfter: 1,
            totalMultiplier: 1,
            flashType: null
          },
          broadcastMock
        )

        expect(broadcastMock).toHaveBeenCalledTimes(1)
        const payload = JSON.parse(broadcastMock.mock.calls[0]![1])
        expect(payload.type).toBe('RESONANCE')
        randomSpy.mockRestore()
      })
    })
  })

  describe('Demo Festival Scheduler', () => {
    it('should schedule and launch weighted demo festivals', async () => {
      const broadcastMock = vi.fn()

      const randomSpy = vi
        .spyOn(Math, 'random')
        // First roll determines demo scheduling delay.
        .mockReturnValueOnce(0.5)
        // Second roll selects weighted demo festival index
        .mockReturnValueOnce(0.0)

      festivalService.startDemoFestivalScheduler(broadcastMock)

      // 18 mins (Min) + 0.5 * 6 mins (Range) = 21 mins = 1,260,000ms
      await vi.advanceTimersByTimeAsync(21 * 60 * 1000)

      expect(broadcastMock).toHaveBeenCalledTimes(1)
      const payload = JSON.parse(broadcastMock.mock.calls[0]![1])
      expect(payload.isDemo).toBe(true)
      expect(payload.triggeredBy).toBe('Oracle')

      randomSpy.mockRestore()
    })

    it('should prevent double-instantiation of demo scheduler loops', async () => {
      const firstBroadcast = vi.fn()
      const secondBroadcast = vi.fn()

      festivalService.startDemoFestivalScheduler(firstBroadcast)
      festivalService.startDemoFestivalScheduler(secondBroadcast)

      await vi.advanceTimersByTimeAsync(25 * 60 * 1000)

      expect(firstBroadcast).toHaveBeenCalled()
      expect(secondBroadcast).not.toHaveBeenCalled()
    })

    it('should bypass scheduler execution if global states are locked', async () => {
      const broadcastMock = vi.fn()

      // Mock random to consistently return 0.0 for stable delay and weight math
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.0)

      festivalService.startDemoFestivalScheduler(broadcastMock)

      // Advance by 15 minutes (before the scheduled 18-minute demo tick)
      await vi.advanceTimersByTimeAsync(15 * 60 * 1000)

      // Trigger a player festival to lock the system until 22 minutes (15 mins + 2 mins duration + 5 mins lockout)
      festivalService.triggerVaultFestival(
        'PlayerOne',
        'user_001',
        broadcastMock
      )
      broadcastMock.mockClear()

      // Advance clock by 3 more minutes to reach the 18-minute scheduler tick
      await vi.advanceTimersByTimeAsync(3 * 60 * 1000)

      // Since the service is locked under active lockout, no demo festival should launch
      expect(broadcastMock).not.toHaveBeenCalled()

      randomSpy.mockRestore()
    })

    it('should skip demo festival launch if player triggered a festival within the quiet window', async () => {
      const broadcastMock = vi.fn()

      // Mock random to consistently return 0.0 for stable delay and weight math
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.0)

      festivalService.startDemoFestivalScheduler(broadcastMock)

      // Advance clock by 15 minutes
      await vi.advanceTimersByTimeAsync(15 * 60 * 1000)

      // Trigger player festival. This updates last player festival timestamp
      festivalService.triggerVaultFestival(
        'PlayerOne',
        'user_001',
        broadcastMock
      )
      broadcastMock.mockClear()

      // Advance clock past active window (2 minutes) to reach 17 minutes total elapsed
      await vi.advanceTimersByTimeAsync(2 * 60 * 1000)

      // Advance another 1 minute to trigger the scheduled 18-minute scheduler check
      // Player activity is within quiet window, so demo launch is blocked.
      await vi.advanceTimersByTimeAsync(1 * 60 * 1000)

      // The demo festival launch should be skipped
      expect(broadcastMock).not.toHaveBeenCalled()

      randomSpy.mockRestore()
    })
  })
})
