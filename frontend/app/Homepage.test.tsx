import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
  act
} from '@testing-library/react'
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock
} from 'vitest'
import HomePage from './page'

interface StoreMock extends Mock {
  getState: Mock
}

const { mockUserStore, mockGameStore, mockUIStore } = vi.hoisted(() => {
  const createMockStore = () => {
    const mock = vi.fn() as unknown as StoreMock
    mock.getState = vi.fn()
    return mock
  }

  return {
    mockUserStore: createMockStore(),
    mockGameStore: createMockStore(),
    mockUIStore: createMockStore()
  }
})

vi.mock('./stores/userStore', () => ({ useUserStore: mockUserStore }))
vi.mock('./stores/gameStore', () => ({ useGameStore: mockGameStore }))
vi.mock('./stores/uiStore', () => ({ useUIStore: mockUIStore }))

vi.mock('@/components/MatchList', () => ({ default: () => null }))
vi.mock('@/components/PendingMatchCard', () => ({ default: () => null }))
vi.mock('@/components/LiveStatTicker', () => ({ default: () => null }))
vi.mock('@/components/ModeButton', () => ({
  default: ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button onClick={onClick}>{label}</button>
  )
}))
vi.mock('@/components/overlays/EdgeGlow', () => ({ default: () => null }))
vi.mock('@/components/overlays/ConfettiOverlay', () => ({
  default: () => null
}))
vi.mock('@/components/overlays/ResultAnimOverlay', () => ({
  default: () => null
}))
vi.mock('@/components/badges/FlashBadge', () => ({ default: () => null }))
vi.mock('@/components/badges/StreakBadge', () => ({ default: () => null }))
vi.mock('@/components/BonusExplainerPopover', () => ({ default: () => null }))
vi.mock('@/components/WelcomeModal', () => ({ default: () => null }))

vi.mock('@/hooks/useSound', () => ({
  useSound: () => ({
    soundOn: true,
    toggleSound: vi.fn(),
    playWin: vi.fn(),
    playLoss: vi.fn(),
    playCards: vi.fn(),
    playElectric: vi.fn(),
    playFire: vi.fn(),
    playMoon: vi.fn()
  })
}))
vi.mock('@/hooks/useInfiniteScroll', () => ({
  useInfiniteScroll: () => ({
    matches: [],
    hasMore: false,
    loadMatches: vi.fn(),
    setMatches: vi.fn(),
    isLoadingMore: false
  })
}))
vi.mock('@/hooks/useAnimatedBigInt', () => ({
  useAnimatedBigInt: (v: bigint) => v
}))
vi.mock('@/hooks/useTabGuard', () => ({
  useTabGuard: () => false
}))
vi.mock('@/lib/user', () => ({
  getOrCreateUser: () => ({
    userId: 'test',
    shortId: 'abc',
    nickname: 'TestGuy'
  }),
  isUserValid: () => true
}))
vi.mock('@/lib/api', () => ({
  fetchLatestMatches: vi.fn(() => Promise.resolve({ matches: [], total: 0 })),
  fetchPendingMatches: vi.fn(() => Promise.resolve([])),
  fetchUserPoints: vi.fn(() =>
    Promise.resolve({
      points: '500000',
      peakPoints: '500000',
      nickname: 'TestGuy'
    })
  ),
  fetchUnifiedLeaderboard: vi.fn(() => Promise.resolve([])),
  postPrediction: vi.fn()
}))

describe('HomePage', () => {
  const setupMocks = (
    userOverrides = {},
    gameOverrides = {},
    uiOverrides = {}
  ) => {
    const userState = {
      points: 500000n,
      pointsLoaded: true,
      betAmount: 500000n,
      peakPoints: 500000n,
      autoAllIn: true,
      isHydrated: true,
      winStreak: 0,
      streakMult: 1,
      displayNickname: 'TestGuy',
      dailyRank: null,
      setBetAmount: vi.fn(),
      setAutoAllIn: vi.fn(),
      setWinStreak: vi.fn(),
      setStreakMult: vi.fn(),
      setDailyRank: vi.fn(),
      applyPointsUpdate: vi.fn(),
      ...userOverrides
    }
    const gameState = {
      backendReady: true,
      pendingMatches: [],
      predictions: new Map(),
      activeFlashEvent: null,
      flashBuffRemaining: 0,
      serverOffset: 0,
      now: Date.now(),
      tickNow: vi.fn(),
      markReady: vi.fn(),
      addPendingMatch: vi.fn(),
      removePendingMatch: vi.fn(),
      setPrediction: vi.fn(),
      updatePrediction: vi.fn(),
      deletePrediction: vi.fn(),
      setActiveFlashEvent: vi.fn(),
      setFlashBuffRemaining: vi.fn(),
      decrementFlashBuff: vi.fn(),
      setServerOffset: vi.fn(),
      setMatches: vi.fn(),
      setVisualMode: vi.fn(),
      setLiveTheme: vi.fn(),
      ...gameOverrides
    }
    const uiState = {
      resultAnim: null,
      notification: null,
      errorMessage: null,
      inputString: '500000',
      showJumpButton: false,
      showPointsInfo: false,
      showPointsExplainer: false,
      isFocused: false,
      persistentError: null,
      showWelcomeModal: false,
      setResultAnim: vi.fn(),
      clearResultAnim: vi.fn(),
      setNotification: vi.fn(),
      triggerError: vi.fn(),
      setShowJumpButton: vi.fn(),
      setShowPointsInfo: vi.fn(),
      setShowPointsExplainer: vi.fn(),
      setIsFocused: vi.fn(),
      setInputString: vi.fn(),
      setPersistentError: vi.fn(),
      setShowWelcomeModal: vi.fn(),
      ...uiOverrides
    }

    mockUserStore.mockReturnValue(userState)
    mockUserStore.getState.mockReturnValue(userState)
    mockGameStore.mockReturnValue(gameState)
    mockGameStore.getState.mockReturnValue(gameState)
    mockUIStore.mockReturnValue(uiState)
    mockUIStore.getState.mockReturnValue(uiState)
  }

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

    global.EventSource = vi.fn().mockImplementation(function () {
      return {
        addEventListener: vi.fn(),
        close: vi.fn(),
        removeEventListener: vi.fn(),
        readyState: 0
      }
    }) as unknown as typeof EventSource

    setupMocks()
  })

  afterEach(cleanup)

  it('renders user nickname from store', async () => {
    render(<HomePage />)
    expect(await screen.findByText('TestGuy')).toBeInTheDocument()
  })

  it('displays formatted balance in bet input when AUTO is enabled', async () => {
    setupMocks({ autoAllIn: true, points: 500000n })
    render(<HomePage />)

    const input = screen.getByRole('textbox') as HTMLInputElement

    await waitFor(() => expect(input.placeholder).toBe('500.000'))
    expect(input.value).toBe('')
  })

  it('toggles autoAllIn state on button click', async () => {
    const setAutoAllIn = vi.fn()
    setupMocks({ setAutoAllIn })
    render(<HomePage />)
    fireEvent.click(screen.getByText(/AUTO ON/i))
    expect(setAutoAllIn).toHaveBeenCalledWith(false)
  })

  it('renders connection overlay when backend is not ready', () => {
    setupMocks({}, { backendReady: false })
    render(<HomePage />)
    expect(screen.getByText(/Connecting to live stream/i)).toBeInTheDocument()
  })

  it('forces 100k floor on bet input blur', async () => {
    const setBetAmount = vi.fn()
    setupMocks({ autoAllIn: false, points: 500000n, setBetAmount })
    render(<HomePage />)
    const input = screen.getByRole('textbox')
    await act(async () => {
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: '10' } })
      fireEvent.blur(input)
    })
    expect(setBetAmount).toHaveBeenCalledWith(100000n)
  })

  it('sets bet to max points when ALL IN is clicked', async () => {
    const setBetAmount = vi.fn()
    setupMocks({ autoAllIn: false, points: 500000n, setBetAmount })
    render(<HomePage />)
    fireEvent.click(screen.getByText(/ALL IN/i))
    expect(setBetAmount).toHaveBeenCalledWith(500000n)
  })
})
