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
import DashboardCard from './DashboardCard'

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

vi.mock('@/app/stores/userStore', () => ({ useUserStore: mockUserStore }))
vi.mock('@/app/stores/gameStore', () => ({ useGameStore: mockGameStore }))
vi.mock('@/app/stores/uiStore', () => ({ useUIStore: mockUIStore }))

vi.mock('@/components/icons/GemIcon', () => ({ default: () => null }))
vi.mock('@/components/icons/InfoIcon', () => ({ default: () => null }))
vi.mock('@/components/icons/CloseIcon', () => ({ default: () => null }))
vi.mock('@/components/icons/SoundIcon', () => ({ default: () => null }))
vi.mock('@/components/relics/RelicSlot', () => ({ default: () => null }))
vi.mock('@/components/ui/SoundControlPopover', () => ({ default: () => null }))
vi.mock('@/components/badges/FlashBadge', () => ({ default: () => null }))
vi.mock('@/components/badges/StreakBadge', () => ({ default: () => null }))
vi.mock('@/components/ui/ModeButton', () => ({
  default: ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button onClick={onClick}>{label}</button>
  )
}))

vi.mock('@/hooks/useSound', () => ({
  useSound: () => ({
    soundOn: true,
    toggleSound: vi.fn(),
    volume: 1,
    setVolume: vi.fn()
  })
}))
vi.mock('@/hooks/useAnimatedBigInt', () => ({
  useAnimatedBigInt: (v: bigint) => v
}))

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
    stylePreference: 'default',
    setBetAmount: vi.fn(),
    setAutoAllIn: vi.fn(),
    ...userOverrides
  }

  const gameState = {
    visualMode: null,
    oracleSide: null,
    festivalModeKey: null,
    flashBuffRemaining: 0,
    ...gameOverrides
  }

  const uiState = {
    showPointsInfo: false,
    setShowPointsInfo: vi.fn(),
    showPointsExplainer: false,
    setShowPointsExplainer: vi.fn(),
    isFocused: false,
    setIsFocused: vi.fn(),
    inputString: '500000',
    setInputString: vi.fn(),
    notification: null,
    setNotification: vi.fn(),
    oracleVolume: 1,
    setOracleVolume: vi.fn(),
    ...uiOverrides
  }

  mockUserStore.mockReturnValue(userState)
  mockUserStore.getState.mockReturnValue(userState)
  mockGameStore.mockReturnValue(gameState)
  mockGameStore.getState.mockReturnValue(gameState)
  mockUIStore.mockReturnValue(uiState)
  mockUIStore.getState.mockReturnValue(uiState)
}

describe('DashboardCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  afterEach(cleanup)

  it('renders user nickname from store', async () => {
    render(<DashboardCard />)
    expect(await screen.findByText('TestGuy')).toBeInTheDocument()
  })

  it('displays formatted balance in bet input when AUTO is enabled', async () => {
    setupMocks({ autoAllIn: true, points: 500000n, betAmount: 500000n })
    render(<DashboardCard />)

    const input = screen.getByRole('textbox') as HTMLInputElement
    await waitFor(() => expect(input.placeholder).toBe('500.000'))
    expect(input.value).toBe('')
  })

  it('toggles autoAllIn state on button click', async () => {
    const setAutoAllIn = vi.fn()
    setupMocks({ autoAllIn: true, setAutoAllIn })
    render(<DashboardCard />)

    fireEvent.click(screen.getByText(/AUTO ON/i))
    expect(setAutoAllIn).toHaveBeenCalledWith(false)
  })

  it('forces 100k floor on bet input blur', async () => {
    const setBetAmount = vi.fn()
    setupMocks({ autoAllIn: false, points: 500000n, setBetAmount })
    render(<DashboardCard />)

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
    render(<DashboardCard />)

    fireEvent.click(screen.getByText(/ALL IN/i))
    expect(setBetAmount).toHaveBeenCalledWith(500000n)
  })
})
