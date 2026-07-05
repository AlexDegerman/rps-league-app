import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Control the scheduler's perceived time.
const INITIAL_SYSTEM_TIME = new Date('2026-04-02T10:00:00Z').getTime()

describe('Global Event Service', () => {
  let globalEventService: typeof import('./globalEventService.js')

  beforeEach(async () => {
    // Reset module state between tests because scheduler flags persist in the module cache.
    vi.resetModules()
    globalEventService = await import('./globalEventService.js')
    vi.useFakeTimers()
    vi.setSystemTime(INITIAL_SYSTEM_TIME)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.clearAllTimers()
  })

  describe('Module State Initialization', () => {
    it('should return null event state when no event has been initialized', () => {
      const state = globalEventService.getGlobalEventState()
      expect(state.event).toBeNull()

      const activeEvent = globalEventService.getActiveGlobalEvent()
      expect(activeEvent).toBeNull()
    })
  })

  describe('applyGlobalEventBuff - Mathematical Verification', () => {
    const standardBet = 100000n

    it('should bypass calculations and return base gainLoss if no global event is active', () => {
      const baseGain = 1000000000000n

      const result = globalEventService.applyGlobalEventBuff(
        true,
        baseGain,
        standardBet
      )

      expect(result.gainLossMultiplied).toBe(baseGain)
      expect(result.echoAmount).toBe(0n)
      expect(result.buffType).toBeNull()
    })

    it('should bypass calculations if the transaction is a loss (isWin is false)', () => {
      const baseLoss = -50000n

      const result = globalEventService.applyGlobalEventBuff(
        false,
        baseLoss,
        standardBet
      )

      expect(result.gainLossMultiplied).toBe(baseLoss)
      expect(result.echoAmount).toBe(0n)
      expect(result.buffType).toBeNull()
    })

    describe('TIDAL_SURGE (+20% Echo) Precision & Truncation Boundaries', () => {
      it('should apply exact 20% echo on divisible wins', () => {
        const broadcastMock = vi.fn()
        const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.0)

        globalEventService.startGlobalEventScheduler(broadcastMock)

        // Advance into the warning phase.
        vi.advanceTimersByTime(7 * 60 * 1000)

        expect(broadcastMock).toHaveBeenCalledTimes(1)
        const warningCall = broadcastMock.mock.calls[0]!
        expect(warningCall[0]).toBe('global_event_warning')

        const warningPayload = JSON.parse(warningCall[1])
        expect(warningPayload.type).toBe('TIDAL_SURGE')
        expect(warningPayload.phase).toBe('warning')

        // Advance into the active phase.
        vi.advanceTimersByTime(90 * 1000)

        expect(broadcastMock).toHaveBeenCalledTimes(2)
        expect(broadcastMock.mock.calls[1]![0]).toBe('global_event_start')

        const baseGain = 500000n
        const result = globalEventService.applyGlobalEventBuff(
          true,
          baseGain,
          standardBet
        )

        expect(result.buffType).toBe('TIDAL_SURGE')
        expect(result.echoAmount).toBe(100000n) // 500000 / 5 = 100000
        expect(result.gainLossMultiplied).toBe(600000n) // 500000 + 100000

        randomSpy.mockRestore()
      })

      it('should handle BigInt floor-division truncation correctly on values not cleanly divisible by 5', () => {
        const broadcastMock = vi.fn()
        const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.0)

        globalEventService.startGlobalEventScheduler(broadcastMock)

        // Fast-forward past the 7-minute cooldown and 90-second warning countdown
        vi.advanceTimersByTime(7 * 60 * 1000 + 90 * 1000)

        const baseGain = 999n // 999 is not cleanly divisible by 5
        const result = globalEventService.applyGlobalEventBuff(
          true,
          baseGain,
          standardBet
        )

        // Math: 999 / 5 = 199.8 -> BigInt division truncates decimal remainder completely to 199
        expect(result.echoAmount).toBe(199n)
        expect(result.gainLossMultiplied).toBe(1198n) // 999 + 199

        randomSpy.mockRestore()
      })
    })

    describe('MIRAGE_CATACLYSM (Random 15% - 50% Echo) Distribution Limits', () => {
      it('should enforce the strict minimum boundary condition (15% factor)', () => {
        const broadcastMock = vi.fn()

        // First roll selects MIRAGE_CATACLYSM (weight maps above index thresholds to ~0.95)
        // Second roll drives factor random assignment to absolute minimum boundary (0.0)
        const randomSpy = vi
          .spyOn(Math, 'random')
          .mockReturnValueOnce(0.0) // Cooldown
          .mockReturnValueOnce(0.95) // Event type: MIRAGE_CATACLYSM
          .mockReturnValueOnce(0.0) // Warning duration
          .mockReturnValueOnce(0.0) // Active duration
          .mockReturnValueOnce(0.0) // Msg index
          .mockReturnValueOnce(0.0) // Speech index
          .mockReturnValueOnce(0.0) // Echo factor roll (yields 15)

        globalEventService.startGlobalEventScheduler(broadcastMock)

        vi.advanceTimersByTime(7 * 60 * 1000)
        const warningData = JSON.parse(broadcastMock.mock.calls[0]![1])
        vi.advanceTimersByTime(warningData.activeAt - warningData.startedAt)

        const baseGain = 100000n
        const result = globalEventService.applyGlobalEventBuff(
          true,
          baseGain,
          standardBet
        )

        expect(result.buffType).toBe('MIRAGE_CATACLYSM')
        expect(result.echoAmount).toBe(15000n) // exactly 15% of 100000
        expect(result.gainLossMultiplied).toBe(115000n)

        randomSpy.mockRestore()
      })

      it('should enforce the strict maximum boundary condition (50% factor)', () => {
        const broadcastMock = vi.fn()

        const randomSpy = vi
          .spyOn(Math, 'random')
          .mockReturnValueOnce(0.0) // Cooldown
          .mockReturnValueOnce(0.9) // Event type: MIRAGE_CATACLYSM
          .mockReturnValueOnce(0.0) // Warning duration
          .mockReturnValueOnce(0.0) // Active duration
          .mockReturnValueOnce(0.0) // Msg index
          .mockReturnValueOnce(0.0) // Speech index
          .mockReturnValueOnce(0.999) // Echo factor roll (yields 50)

        globalEventService.startGlobalEventScheduler(broadcastMock)

        vi.advanceTimersByTime(7 * 60 * 1000 + 90 * 1000)

        const baseGain = 100000n
        const result = globalEventService.applyGlobalEventBuff(
          true,
          baseGain,
          standardBet
        )

        expect(result.buffType).toBe('MIRAGE_CATACLYSM')
        expect(result.echoAmount).toBe(50000n) // exactly 50% of 100000
        expect(result.gainLossMultiplied).toBe(150000n)

        randomSpy.mockRestore()
      })
    })

    describe('Passive Telemetry Events (SOLAR_FLARE & CYCLONE_BLITZ)', () => {
      it('should return unmodified gainLoss under SOLAR_FLARE but populate event metadata', () => {
        const broadcastMock = vi.fn()
        const randomSpy = vi
          .spyOn(Math, 'random')
          .mockReturnValueOnce(0.0) // Cooldown
          .mockReturnValueOnce(0.7) // Event type: SOLAR_FLARE
          .mockReturnValueOnce(0.0) // Warning duration
          .mockReturnValueOnce(0.0) // Active duration
          .mockReturnValueOnce(0.0) // Msg index
          .mockReturnValueOnce(0.0) // Speech index

        globalEventService.startGlobalEventScheduler(broadcastMock)

        vi.advanceTimersByTime(7 * 60 * 1000 + 90 * 1000)

        const baseGain = 100000n
        const result = globalEventService.applyGlobalEventBuff(
          true,
          baseGain,
          standardBet
        )

        expect(result.gainLossMultiplied).toBe(baseGain)
        expect(result.echoAmount).toBe(0n)
        expect(result.buffType).toBe('SOLAR_FLARE')

        randomSpy.mockRestore()
      })

      it('should return unmodified gainLoss under CYCLONE_BLITZ but populate event metadata', () => {
        const broadcastMock = vi.fn()
        const randomSpy = vi
          .spyOn(Math, 'random')
          .mockReturnValueOnce(0.0) // Cooldown
          .mockReturnValueOnce(0.4) // Maps to CYCLONE_BLITZ
          .mockReturnValueOnce(0.0) // Warning duration
          .mockReturnValueOnce(0.0) // Active duration
          .mockReturnValueOnce(0.0) // Msg index
          .mockReturnValueOnce(0.0) // Speech index

        globalEventService.startGlobalEventScheduler(broadcastMock)

        vi.advanceTimersByTime(7 * 60 * 1000)
        const warningData = JSON.parse(broadcastMock.mock.calls[0]![1])
        vi.advanceTimersByTime(warningData.activeAt - warningData.startedAt)

        const baseGain = 100000n
        const result = globalEventService.applyGlobalEventBuff(
          true,
          baseGain,
          standardBet
        )

        expect(result.gainLossMultiplied).toBe(baseGain)
        expect(result.echoAmount).toBe(0n)
        expect(result.buffType).toBe('CYCLONE_BLITZ')

        randomSpy.mockRestore()
      })
    })
  })

  describe('Scheduler State Machine & SSE Timing Controls', () => {
    it('should correctly broadcast warning, active start, and completion states across transitions', () => {
      const broadcastMock = vi.fn()
      const randomSpy = vi
        .spyOn(Math, 'random')
        .mockReturnValueOnce(0.0) // Cooldown (7 minutes)
        .mockReturnValueOnce(0.4) // Maps to CYCLONE_BLITZ
        .mockReturnValueOnce(0.0) // Warning duration (90 seconds)
        .mockReturnValueOnce(0.0) // Active duration (60 seconds)
        .mockReturnValueOnce(0.0) // Msg index
        .mockReturnValueOnce(0.0) // Speech index

      globalEventService.startGlobalEventScheduler(broadcastMock)

      // Advance into the warning phase.
      vi.advanceTimersByTime(7 * 60 * 1000)

      expect(broadcastMock).toHaveBeenCalledTimes(1)
      const warningCall = broadcastMock.mock.calls[0]!
      expect(warningCall[0]).toBe('global_event_warning')

      const warningPayload = JSON.parse(warningCall[1])
      expect(warningPayload.type).toBe('CYCLONE_BLITZ')
      expect(warningPayload.phase).toBe('warning')
      expect(warningPayload.activeAt).toBeGreaterThan(warningPayload.startedAt)
      expect(warningPayload.message).toContain('Cyclone Blitz')
      expect(warningPayload.speech).toContain('Cyclone... Blitz')

      // Advance into the active phase.
      const warningDuration = warningPayload.activeAt - warningPayload.startedAt
      vi.advanceTimersByTime(warningDuration)

      expect(broadcastMock).toHaveBeenCalledTimes(2)
      const startCall = broadcastMock.mock.calls[1]!
      expect(startCall[0]).toBe('global_event_start')

      const startPayload = JSON.parse(startCall[1])
      expect(startPayload.type).toBe('CYCLONE_BLITZ')
      expect(startPayload.phase).toBe('active')

      // Advance until the event expires.
      const activeDuration = startPayload.endsAt - startPayload.activeAt
      vi.advanceTimersByTime(activeDuration)

      expect(broadcastMock).toHaveBeenCalledTimes(3)
      const endCall = broadcastMock.mock.calls[2]!
      expect(endCall[0]).toBe('global_event_end')
      expect(JSON.parse(endCall[1]).type).toBe('CYCLONE_BLITZ')

      randomSpy.mockRestore()
    })

    it('should not allow double-initialization of the scheduler state', () => {
      const broadcastMockFirst = vi.fn()
      const broadcastMockSecond = vi.fn()

      globalEventService.startGlobalEventScheduler(broadcastMockFirst)
      globalEventService.startGlobalEventScheduler(broadcastMockSecond)

      vi.advanceTimersByTime(12 * 60 * 1000)

      // First call starts, second is dropped silently to protect SSE streams.
      expect(broadcastMockFirst).toHaveBeenCalled()
      expect(broadcastMockSecond).not.toHaveBeenCalled()
    })

    it('should automatically invalidate and clean up active modules when the expiration threshold passes', () => {
      const broadcastMock = vi.fn()

      const randomSpy = vi
        .spyOn(Math, 'random')
        .mockReturnValueOnce(0.0) // Cooldown (7 minutes)
        .mockReturnValueOnce(0.1) // Maps to TIDAL_SURGE
        .mockReturnValueOnce(0.0) // Warning duration (90 seconds)
        .mockReturnValueOnce(0.0) // Active duration (60 seconds)
        .mockReturnValueOnce(0.0) // Msg index
        .mockReturnValueOnce(0.0) // Speech index

      globalEventService.startGlobalEventScheduler(broadcastMock)

      vi.advanceTimersByTime(7 * 60 * 1000)
      const warningData = JSON.parse(broadcastMock.mock.calls[0]![1])

      // Advance into the active phase.
      vi.advanceTimersByTime(warningData.activeAt - warningData.startedAt)
      expect(globalEventService.getActiveGlobalEvent()).not.toBeNull()

      // Advance clock past endsAt.
      const activeDuration = warningData.endsAt - warningData.activeAt
      vi.advanceTimersByTime(activeDuration + 1000) // Advance one second beyond the expiration time.

      expect(globalEventService.getActiveGlobalEvent()).toBeNull()

      randomSpy.mockRestore()
    })
  })
})
