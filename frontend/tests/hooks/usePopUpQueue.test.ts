import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePopupQueue } from '../../hooks/usePopupQueue'
import { EventTheme, GlobalEventType } from '@/types/events'
import { AchievementNotif } from '@/types/achievements'

interface Popup {
  id: string
  kind:
    | 'flash_event'
    | 'global_event'
    | 'ascension'
    | 'relic_drop'
    | 'achievement'
  payload?: unknown
}

interface MockUIStoreState {
  activePopup: Popup | null
  popupQueue: Popup[]
  readyToShow: boolean
  showGlobalActivationOverlay: boolean
  dequeuePopup: () => void
  setShowGlobalActivationOverlay: (val: boolean) => void
}

interface MockGameStoreState {
  isBonusActive: boolean
  setActiveFlashEvent: (theme: EventTheme) => void
  setLiveTheme: (theme: EventTheme) => void
  setFlashEventJustTriggered: (theme: EventTheme) => void
  pushAchievement: (notif: AchievementNotif) => void
  setGlobalEventActive: (type: GlobalEventType, endsAt: number) => void
}

interface PopupQueueSounds {
  playMoon: () => void
  playCards: () => void
  playElectric: () => void
  playFire: () => void
  playFanfare: (vol?: number) => void
  playTidalSurge: () => void
  playSolarFlare: () => void
  playCycloneBlitz: () => void
  playMirageCataclysm: () => void
}

let mockUIStoreState: MockUIStoreState
let mockGameStoreState: MockGameStoreState

vi.mock('@/app/stores/uiStore', () => {
  const mockStoreFn = vi.fn(
    <T>(selector?: (s: MockUIStoreState) => T): T | MockUIStoreState =>
      typeof selector === 'function'
        ? selector(mockUIStoreState)
        : mockUIStoreState
  )
  const mockStore = Object.assign(mockStoreFn, {
    getState: () => mockUIStoreState,
    setState: vi.fn(
      (
        update:
          | Partial<MockUIStoreState>
          | ((s: MockUIStoreState) => Partial<MockUIStoreState>)
      ) => {
        const nextState =
          typeof update === 'function' ? update(mockUIStoreState) : update
        Object.assign(mockUIStoreState, nextState)
      }
    )
  })
  return {
    useUIStore: mockStore as unknown as {
      <T>(selector?: (s: MockUIStoreState) => T): T
      getState: () => MockUIStoreState
      setState: (
        update:
          | Partial<MockUIStoreState>
          | ((s: MockUIStoreState) => Partial<MockUIStoreState>)
      ) => void
    }
  }
})

vi.mock('@/app/stores/gameStore', () => {
  const mockStoreFn = vi.fn(
    <T>(selector?: (s: MockGameStoreState) => T): T | MockGameStoreState =>
      typeof selector === 'function'
        ? selector(mockGameStoreState)
        : mockGameStoreState
  )
  const mockStore = Object.assign(mockStoreFn, {
    getState: () => mockGameStoreState,
    setState: vi.fn(
      (
        update:
          | Partial<MockGameStoreState>
          | ((s: MockGameStoreState) => Partial<MockGameStoreState>)
      ) => {
        const nextState =
          typeof update === 'function' ? update(mockGameStoreState) : update
        Object.assign(mockGameStoreState, nextState)
      }
    )
  })
  return {
    useGameStore: mockStore as unknown as {
      <T>(selector?: (s: MockGameStoreState) => T): T
      getState: () => MockGameStoreState
      setState: (
        update:
          | Partial<MockGameStoreState>
          | ((s: MockGameStoreState) => Partial<MockGameStoreState>)
      ) => void
    }
  }
})

const INITIAL_SYSTEM_TIME = new Date('2026-04-02T10:00:00Z').getTime()

describe('usePopupQueue Hook', () => {
  let mockSounds: PopupQueueSounds

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(INITIAL_SYSTEM_TIME)
    vi.clearAllMocks()

    mockUIStoreState = {
      activePopup: null,
      popupQueue: [],
      readyToShow: false,
      showGlobalActivationOverlay: false,
      dequeuePopup: vi.fn(),
      setShowGlobalActivationOverlay: vi.fn((val: boolean) => {
        mockUIStoreState.showGlobalActivationOverlay = val
      })
    }

    mockGameStoreState = {
      isBonusActive: false,
      setActiveFlashEvent: vi.fn(),
      setLiveTheme: vi.fn(),
      setFlashEventJustTriggered: vi.fn(),
      pushAchievement: vi.fn(),
      setGlobalEventActive: vi.fn()
    }

    mockSounds = {
      playMoon: vi.fn(),
      playCards: vi.fn(),
      playElectric: vi.fn(),
      playFire: vi.fn(),
      playFanfare: vi.fn(),
      playTidalSurge: vi.fn(),
      playSolarFlare: vi.fn(),
      playCycloneBlitz: vi.fn(),
      playMirageCataclysm: vi.fn()
    }
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.clearAllTimers()
  })

  describe('Flash Event Popup Processing', () => {
    it('should process flash event popup after delay', () => {
      mockUIStoreState.activePopup = {
        id: 'evt-101',
        kind: 'flash_event',
        payload: 'LUNAR'
      }

      renderHook(() => usePopupQueue(mockSounds))

      expect(
        mockGameStoreState.setFlashEventJustTriggered
      ).not.toHaveBeenCalled()

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(
        mockGameStoreState.setFlashEventJustTriggered
      ).toHaveBeenCalledWith('LUNAR')
      expect(mockGameStoreState.setActiveFlashEvent).toHaveBeenCalledWith(
        'LUNAR'
      )
      expect(mockGameStoreState.setLiveTheme).toHaveBeenCalledWith('LUNAR')
      expect(mockSounds.playMoon).toHaveBeenCalled()
      expect(mockUIStoreState.readyToShow).toBe(true)
    })

    it('should route themed sounds appropriately for non-lunar flash configurations', () => {
      mockUIStoreState.activePopup = {
        id: 'evt-cards',
        kind: 'flash_event',
        payload: 'CARDS'
      }

      renderHook(() => usePopupQueue(mockSounds))

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(mockSounds.playCards).toHaveBeenCalled()
    })

    it('should trigger electrical transitions when flash theme is electric', () => {
      mockUIStoreState.activePopup = {
        id: 'evt-elec',
        kind: 'flash_event',
        payload: 'ELECTRIC'
      }

      renderHook(() => usePopupQueue(mockSounds))

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(mockSounds.playElectric).toHaveBeenCalled()
    })

    it('should trigger hellfire audio when theme is fire-oriented', () => {
      mockUIStoreState.activePopup = {
        id: 'evt-fire',
        kind: 'flash_event',
        payload: 'HELLFIRE'
      }

      renderHook(() => usePopupQueue(mockSounds))

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(mockSounds.playFire).toHaveBeenCalled()
    })

    it('should not process the same popup twice if rendered or updated multiple times', () => {
      mockUIStoreState.activePopup = {
        id: 'evt-duplicate',
        kind: 'flash_event',
        payload: 'LUNAR'
      }

      const { rerender } = renderHook(() => usePopupQueue(mockSounds))

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(mockGameStoreState.setActiveFlashEvent).toHaveBeenCalledTimes(1)

      rerender()

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(mockGameStoreState.setActiveFlashEvent).toHaveBeenCalledTimes(1)
    })
  })

  describe('Lifecycle & Timing Cleanups', () => {
    it('should clean up pending timer on unmount and perform no store operations', () => {
      mockUIStoreState.activePopup = {
        id: 'evt-cleanup',
        kind: 'flash_event',
        payload: 'LUNAR'
      }

      const { unmount } = renderHook(() => usePopupQueue(mockSounds))

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      unmount()

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(mockGameStoreState.setActiveFlashEvent).not.toHaveBeenCalled()
      expect(mockUIStoreState.readyToShow).toBe(false)
    })
  })

  describe('Bonus Stage Interferences & Early Returns', () => {
    it('should ignore popup processing while bonus is active', () => {
      mockGameStoreState.isBonusActive = true
      mockUIStoreState.activePopup = {
        id: 'evt-bonus',
        kind: 'flash_event',
        payload: 'LUNAR'
      }

      renderHook(() => usePopupQueue(mockSounds))

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(mockGameStoreState.setActiveFlashEvent).not.toHaveBeenCalled()
      expect(mockSounds.playMoon).not.toHaveBeenCalled()
      expect(mockUIStoreState.readyToShow).toBe(false)
    })
  })

  describe('Global Event Execution Loops', () => {
    it('should process active global events and display the synchronization overlay', () => {
      mockUIStoreState.activePopup = {
        id: 'glob-101',
        kind: 'global_event',
        payload: {
          type: 'TIDAL_SURGE',
          endsAt: INITIAL_SYSTEM_TIME + 10000
        }
      }

      renderHook(() => usePopupQueue(mockSounds))

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(mockGameStoreState.setGlobalEventActive).toHaveBeenCalledWith(
        'TIDAL_SURGE',
        INITIAL_SYSTEM_TIME + 10000
      )
      expect(
        mockUIStoreState.setShowGlobalActivationOverlay
      ).toHaveBeenCalledWith(true)
      expect(mockUIStoreState.showGlobalActivationOverlay).toBe(true)
      expect(mockSounds.playTidalSurge).toHaveBeenCalled()
      expect(mockUIStoreState.readyToShow).toBe(true)
    })

    it('should route global events correctly to play solar flare sound configs', () => {
      mockUIStoreState.activePopup = {
        id: 'glob-solar',
        kind: 'global_event',
        payload: {
          type: 'SOLAR_FLARE',
          endsAt: INITIAL_SYSTEM_TIME + 10000
        }
      }

      renderHook(() => usePopupQueue(mockSounds))

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(mockSounds.playSolarFlare).toHaveBeenCalled()
    })

    it('should route global events correctly to play cyclone blitz sound configs', () => {
      mockUIStoreState.activePopup = {
        id: 'glob-cyclone',
        kind: 'global_event',
        payload: {
          type: 'CYCLONE_BLITZ',
          endsAt: INITIAL_SYSTEM_TIME + 10000
        }
      }

      renderHook(() => usePopupQueue(mockSounds))

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(mockSounds.playCycloneBlitz).toHaveBeenCalled()
    })

    it('should route global events correctly to play mirage cataclysm sound configs', () => {
      mockUIStoreState.activePopup = {
        id: 'glob-mirage',
        kind: 'global_event',
        payload: {
          type: 'MIRAGE_CATACLYSM',
          endsAt: INITIAL_SYSTEM_TIME + 10000
        }
      }

      renderHook(() => usePopupQueue(mockSounds))

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(mockSounds.playMirageCataclysm).toHaveBeenCalled()
    })

    it('should remove expired global events from queues immediately', () => {
      mockUIStoreState.activePopup = {
        id: 'glob-expired',
        kind: 'global_event',
        payload: {
          type: 'TIDAL_SURGE',
          endsAt: INITIAL_SYSTEM_TIME - 1000
        }
      }

      renderHook(() => usePopupQueue(mockSounds))

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(mockUIStoreState.dequeuePopup).toHaveBeenCalled()
      expect(mockGameStoreState.setGlobalEventActive).not.toHaveBeenCalled()
      expect(mockUIStoreState.showGlobalActivationOverlay).toBe(false)
    })
  })

  describe('Achievement Multi-Notification Splicing', () => {
    it('should batch achievement popups correctly and clear items from the current queue', () => {
      mockUIStoreState.activePopup = {
        id: 'ach-1',
        kind: 'achievement',
        payload: { title: 'First Achievement' }
      }
      mockUIStoreState.popupQueue = [
        {
          id: 'ach-2',
          kind: 'achievement',
          payload: { title: 'Second Achievement' }
        },
        {
          id: 'relic-1',
          kind: 'relic_drop'
        }
      ]

      renderHook(() => usePopupQueue(mockSounds))

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(mockGameStoreState.pushAchievement).toHaveBeenCalledTimes(2)
      expect(mockGameStoreState.pushAchievement).toHaveBeenNthCalledWith(1, {
        title: 'First Achievement'
      })
      expect(mockGameStoreState.pushAchievement).toHaveBeenNthCalledWith(2, {
        title: 'Second Achievement'
      })

      expect(mockUIStoreState.activePopup).toEqual({
        id: 'relic-1',
        kind: 'relic_drop'
      })
      expect(mockUIStoreState.popupQueue).toEqual([])
      expect(mockUIStoreState.readyToShow).toBe(false)
    })
  })

  describe('Prestige Progression & Relic Discoveries', () => {
    it('should process ascension popup and invoke fanfare configurations', () => {
      mockUIStoreState.activePopup = {
        id: 'asc-101',
        kind: 'ascension'
      }

      renderHook(() => usePopupQueue(mockSounds))

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(mockSounds.playFanfare).toHaveBeenCalledWith(0.5)
      expect(mockUIStoreState.readyToShow).toBe(true)
    })

    it('should process relic drop popup and set dynamic configurations without fanfare interferences', () => {
      mockUIStoreState.activePopup = {
        id: 'relic-101',
        kind: 'relic_drop'
      }

      renderHook(() => usePopupQueue(mockSounds))

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(mockSounds.playFanfare).not.toHaveBeenCalled()
      expect(mockUIStoreState.readyToShow).toBe(true)
    })
  })
})
