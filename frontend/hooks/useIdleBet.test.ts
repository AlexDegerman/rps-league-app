import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useIdleBet } from './useIdleBet'
import { postPrediction } from '@/lib/api'
import { getOrCreateUser, isUserValid } from '@/lib/user'
import type {
  PendingMatch,
  PredictionRecord,
  PredictionResponse
} from '@/types/rps'

interface MockIdleStoreState {
  idleSide: 'left' | 'right' | null
  isEligible: boolean
  isProcessing: boolean
  setIsProcessing: (val: boolean) => void
  processedGameIds: Set<string>
  markProcessed: (gameId: string) => void
}

interface MockGameStoreState {
  pendingMatches: PendingMatch[]
  serverOffset: number
  setPrediction: (gameId: string, prediction: PredictionRecord) => void
}

interface MockUserStoreState {
  betAmount: bigint
}

let mockIdleStoreState: MockIdleStoreState
let mockGameStoreState: MockGameStoreState
let mockUserStoreState: MockUserStoreState

vi.mock('@/app/stores/idleStore', () => ({
  useIdleStore: vi.fn(
    <T>(selector: (s: MockIdleStoreState) => T): T =>
      selector(mockIdleStoreState)
  )
}))
vi.mock('@/app/stores/gameStore', () => ({
  useGameStore: vi.fn(
    <T>(selector: (s: MockGameStoreState) => T): T =>
      selector(mockGameStoreState)
  )
}))
vi.mock('@/app/stores/userStore', () => ({
  useUserStore: vi.fn(
    <T>(selector: (s: MockUserStoreState) => T): T =>
      selector(mockUserStoreState)
  )
}))

// Mock API and user utilities
vi.mock('@/lib/api', () => ({
  postPrediction: vi.fn()
}))
vi.mock('@/lib/user', () => ({
  getOrCreateUser: vi.fn(),
  isUserValid: vi.fn()
}))

const INITIAL_SYSTEM_TIME = new Date('2026-04-02T10:00:00Z').getTime()

// Mock prediction response aligning with the backend schema
const mockPredictionResponse: PredictionResponse = {
  success: true,
  gameId: 'game-101',
  userId: 'user-789',
  pointsAfter: '1100'
}

describe('useIdleBet Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(INITIAL_SYSTEM_TIME)

    vi.clearAllMocks()

    mockIdleStoreState = {
      idleSide: 'left',
      isEligible: true,
      isProcessing: false,
      setIsProcessing: vi.fn((val: boolean) => {
        mockIdleStoreState.isProcessing = val
      }),
      processedGameIds: new Set<string>(),
      markProcessed: vi.fn((gameId: string) => {
        mockIdleStoreState.processedGameIds.add(gameId)
      })
    }

    mockGameStoreState = {
      pendingMatches: [
        {
          gameId: 'game-101',
          time: INITIAL_SYSTEM_TIME,
          expiresAt: INITIAL_SYSTEM_TIME + 5000, // 5 seconds remaining
          playerA: 'Alice',
          playerB: 'Bob'
        }
      ],
      serverOffset: 0,
      setPrediction: vi.fn()
    }

    mockUserStoreState = {
      betAmount: 100n
    }

    vi.mocked(getOrCreateUser).mockReturnValue({
      userId: 'user-789',
      nickname: 'IdlePlayer',
      shortId: 'XYZ'
    })
    vi.mocked(isUserValid).mockReturnValue(true)

    vi.mocked(postPrediction).mockResolvedValue({
      ok: true,
      data: mockPredictionResponse
    })

    // Reset visibility state
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      writable: true,
      value: 'visible'
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.clearAllTimers()
  })

  describe('Guard Conditions & Early Returns', () => {
    it('should bypass all execution if the document is hidden', () => {
      // Initialize with eligibility disabled to prevent immediate execution on render mount
      mockIdleStoreState.isEligible = false

      const { rerender } = renderHook(() => useIdleBet())

      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        value: 'hidden'
      })
      act(() => {
        document.dispatchEvent(new Event('visibilitychange'))
      })

      mockIdleStoreState.isEligible = true
      rerender()

      expect(postPrediction).not.toHaveBeenCalled()
    })

    it('should bypass execution if there is no active idle side configured', () => {
      mockIdleStoreState.idleSide = null

      renderHook(() => useIdleBet())

      expect(postPrediction).not.toHaveBeenCalled()
    })

    it('should bypass execution if user is marked as ineligible', () => {
      mockIdleStoreState.isEligible = false

      renderHook(() => useIdleBet())

      expect(postPrediction).not.toHaveBeenCalled()
    })

    it('should bypass execution if a prediction flow is currently in progress', () => {
      mockIdleStoreState.isProcessing = true

      renderHook(() => useIdleBet())

      expect(postPrediction).not.toHaveBeenCalled()
    })

    it('should bypass execution if user configuration is invalid', () => {
      vi.mocked(isUserValid).mockReturnValue(false)

      renderHook(() => useIdleBet())

      expect(postPrediction).not.toHaveBeenCalled()
    })

    it('should bypass execution if the bet amount is zero or negative', () => {
      mockUserStoreState.betAmount = 0n

      renderHook(() => useIdleBet())

      expect(postPrediction).not.toHaveBeenCalled()
    })

    it('should bypass execution if the pending game is already in the processed set', () => {
      mockIdleStoreState.processedGameIds.add('game-101')

      renderHook(() => useIdleBet())

      expect(postPrediction).not.toHaveBeenCalled()
    })
  })

  describe('Match Expiration & Boundary Conditions', () => {
    it('should mark game as processed and abort prediction if remaining time is under 1 second (timeLeft < 1000)', () => {
      mockGameStoreState.pendingMatches[0].expiresAt = INITIAL_SYSTEM_TIME + 999

      renderHook(() => useIdleBet())

      expect(mockIdleStoreState.markProcessed).toHaveBeenCalledWith('game-101')
      expect(postPrediction).not.toHaveBeenCalled()
    })

    it('should proceed to predict if remaining time is exactly 1 second (timeLeft >= 1000)', () => {
      mockGameStoreState.pendingMatches[0].expiresAt =
        INITIAL_SYSTEM_TIME + 1000

      renderHook(() => useIdleBet())

      expect(mockIdleStoreState.markProcessed).toHaveBeenCalledWith('game-101')
      expect(postPrediction).toHaveBeenCalled()
    })
  })

  describe('Prediction Flow & Store Side Effects', () => {
    it('should target Player A when idle side is set to left', () => {
      mockIdleStoreState.idleSide = 'left'

      renderHook(() => useIdleBet())

      expect(mockGameStoreState.setPrediction).toHaveBeenNthCalledWith(
        1,
        'game-101',
        {
          gameId: 'game-101',
          pick: 'Alice',
          confirmed: false,
          totalMultiplier: 1
        }
      )

      expect(postPrediction).toHaveBeenCalledWith({
        userId: 'user-789',
        gameId: 'game-101',
        pick: 'Alice',
        betAmount: '100',
        nickname: 'IdlePlayer',
        shortId: 'XYZ'
      })
    })

    it('should target Player B when idle side is set to right', () => {
      mockIdleStoreState.idleSide = 'right'

      renderHook(() => useIdleBet())

      expect(mockGameStoreState.setPrediction).toHaveBeenNthCalledWith(
        1,
        'game-101',
        {
          gameId: 'game-101',
          pick: 'Bob',
          confirmed: false,
          totalMultiplier: 1
        }
      )

      expect(postPrediction).toHaveBeenCalledWith({
        userId: 'user-789',
        gameId: 'game-101',
        pick: 'Bob',
        betAmount: '100',
        nickname: 'IdlePlayer',
        shortId: 'XYZ'
      })
    })

    it('should transition prediction state to confirmed upon successful API response', async () => {
      vi.mocked(postPrediction).mockResolvedValueOnce({
        ok: true,
        data: mockPredictionResponse
      })

      renderHook(() => useIdleBet())

      for (let i = 0; i < 10; i++) {
        await Promise.resolve()
      }

      expect(mockGameStoreState.setPrediction).toHaveBeenNthCalledWith(
        2,
        'game-101',
        {
          gameId: 'game-101',
          pick: 'Alice',
          confirmed: true,
          totalMultiplier: 1
        }
      )
    })

    it('should release the processing state lock after exactly 300ms timeout post API resolution', async () => {
      vi.mocked(postPrediction).mockResolvedValueOnce({
        ok: true,
        data: mockPredictionResponse
      })

      renderHook(() => useIdleBet())

      expect(mockIdleStoreState.setIsProcessing).toHaveBeenCalledWith(true)

      for (let i = 0; i < 10; i++) {
        await Promise.resolve()
      }

      expect(mockIdleStoreState.setIsProcessing).not.toHaveBeenLastCalledWith(
        false
      )

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(mockIdleStoreState.setIsProcessing).toHaveBeenLastCalledWith(false)
    })
  })

  describe('Document Visibility Dynamic Subscription', () => {
    it('should suspend prediction execution mid-lifecycle if page loses visibility', () => {
      const { rerender } = renderHook(() => useIdleBet())

      act(() => {
        Object.defineProperty(document, 'visibilityState', {
          configurable: true,
          value: 'hidden'
        })
        document.dispatchEvent(new Event('visibilitychange'))
      })

      // Modify game dependencies to trigger hook recalculation
      mockGameStoreState.pendingMatches = [
        {
          gameId: 'game-202',
          time: INITIAL_SYSTEM_TIME,
          expiresAt: INITIAL_SYSTEM_TIME + 10000,
          playerA: 'Alice',
          playerB: 'Bob'
        }
      ]
      rerender()

      expect(mockIdleStoreState.markProcessed).not.toHaveBeenCalledWith(
        'game-202'
      )
    })
  })
})
