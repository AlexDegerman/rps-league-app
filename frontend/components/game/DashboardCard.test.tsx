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
import { useAnimatedBigInt } from '@/hooks/useAnimatedBigInt'

interface StoreMock extends Mock {
  getState: Mock
}

const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
  length: 0,
  key: vi.fn()
}

vi.stubGlobal('localStorage', localStorageMock)

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

vi.mock('@/components/icons/GemIcon', () => ({
  default: ({ className }: { className?: string }) => (
    <div data-testid="gem-icon" className={className} />
  )
}))
vi.mock('@/components/icons/InfoIcon', () => ({
  default: () => <div data-testid="info-icon" />
}))
vi.mock('@/components/icons/CloseIcon', () => ({
  default: () => <div data-testid="close-icon" />
}))
vi.mock('@/components/icons/SoundIcon', () => ({
  default: ({ muted }: { muted: boolean }) => (
    <div data-testid="sound-icon" data-muted={muted} />
  )
}))
vi.mock('@/components/relics/RelicSlot', () => ({ default: () => null }))

vi.mock('@/components/ui/SoundControlPopover', () => ({
  default: () => <div data-testid="sound-popover">Sound Popover Mock</div>
}))
vi.mock('@/components/badges/FlashBadge', () => ({ default: () => null }))
vi.mock('@/components/badges/StreakBadge', () => ({ default: () => null }))
vi.mock('@/components/ui/ModeButton', () => ({
  default: ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button onClick={onClick}>{label}</button>
  )
}))

const mockToggleSound = vi.fn()
const mockSetVolume = vi.fn()
vi.mock('@/hooks/useSound', () => ({
  useSound: () => ({
    soundOn: true,
    toggleSound: mockToggleSound,
    volume: 1,
    setVolume: mockSetVolume
  })
}))

vi.mock('@/hooks/useAnimatedBigInt', () => ({
  useAnimatedBigInt: vi.fn()
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

  mockUserStore.mockImplementation(
    <T,>(selector?: (state: typeof userState) => T) =>
      selector ? selector(userState) : userState
  )
  mockUserStore.getState.mockReturnValue(userState)

  mockGameStore.mockImplementation(
    <T,>(selector?: (state: typeof gameState) => T) =>
      selector ? selector(gameState) : gameState
  )
  mockGameStore.getState.mockReturnValue(gameState)

  mockUIStore.mockImplementation(
    <T,>(selector?: (state: typeof uiState) => T) =>
      selector ? selector(uiState) : uiState
  )
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

    fireEvent.click(screen.getByText(/AUTO\s*MAX\s*ON/i))
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

  it('sets bet to max points when MAX is clicked', async () => {
    const setBetAmount = vi.fn()
    setupMocks({ autoAllIn: false, points: 500000n, setBetAmount })
    render(<DashboardCard />)

    await act(async () => {
      fireEvent.click(screen.getByText(/^MAX$/i))
    })

    expect(setBetAmount).toHaveBeenCalledWith(500000n)
  })

  it('passes stylePreference to useAnimatedBigInt hook', () => {
    setupMocks({ stylePreference: 'neon' })
    render(<DashboardCard />)

    expect(vi.mocked(useAnimatedBigInt)).toHaveBeenCalledWith(
      expect.any(Object),
      500000n,
      'neon',
      1000
    )
  })

  it('handles mouse hover and click events for the points explainer tooltip', () => {
    const setShowPointsExplainer = vi.fn()
    setupMocks(
      { points: 500000n, pointsLoaded: true },
      {},
      { showPointsExplainer: false, setShowPointsExplainer }
    )
    render(<DashboardCard />)

    const trigger = screen.getByTestId('gem-icon').parentElement!

    fireEvent.mouseEnter(trigger)
    expect(setShowPointsExplainer).toHaveBeenLastCalledWith(true)

    fireEvent.mouseLeave(trigger)
    expect(setShowPointsExplainer).toHaveBeenLastCalledWith(false)

    fireEvent.click(trigger)
    expect(setShowPointsExplainer).toHaveBeenLastCalledWith(true)
  })

  it('triggers points information visibility and dismissal on blur', () => {
    const setShowPointsInfo = vi.fn()
    setupMocks({}, {}, { showPointsInfo: false, setShowPointsInfo })
    render(<DashboardCard />)

    const infoButton = screen.getByTestId('info-icon').parentElement!

    fireEvent.click(infoButton)
    expect(setShowPointsInfo).toHaveBeenCalledWith(true)

    fireEvent.blur(infoButton)
    expect(setShowPointsInfo).toHaveBeenLastCalledWith(false)
  })

  it('renders and toggles sound control popover', () => {
    render(<DashboardCard />)

    const soundButton = screen.getByTestId('sound-icon').parentElement!

    expect(screen.queryByTestId('sound-popover')).not.toBeInTheDocument()

    fireEvent.click(soundButton)
    expect(screen.getByTestId('sound-popover')).toBeInTheDocument()

    fireEvent.click(soundButton)
    expect(screen.queryByTestId('sound-popover')).not.toBeInTheDocument()
  })

  it('assigns correct container border styles and dynamic particle wrappers based on visualMode', () => {
    setupMocks({}, { visualMode: 'flash_lunar' }, {})
    const { container } = render(<DashboardCard />)

    const outerCard = container.firstChild as HTMLElement
    expect(outerCard.className).toContain('border-blue-200')
    expect(outerCard.className).toContain('lunar-ring')

    const particles = container.querySelector('.particles-flash_lunar')
    expect(particles).toBeInTheDocument()
  })

  it('renders and handles close action on new visitor notification', () => {
    const setNotification = vi.fn()
    const setItemSpy = vi.spyOn(localStorage, 'setItem')
    setupMocks(
      {},
      {},
      { notification: 'new_visitor', isHydrated: true, setNotification }
    )
    render(<DashboardCard />)

    expect(
      screen.getByText(/You've been granted 200,000 points!/i)
    ).toBeInTheDocument()

    const closeBtn = screen.getByLabelText('Close')
    fireEvent.click(closeBtn)

    expect(setItemSpy).toHaveBeenCalledWith('rps_welcomed', '1')
    expect(setNotification).toHaveBeenCalledWith(null)
  })

  it('renders the fallback browser compatibility notification when bigint support is missing', () => {
    setupMocks({}, {}, { notification: 'no_bigint', isHydrated: true })
    render(<DashboardCard />)

    expect(screen.getByText('Browser Not Supported')).toBeInTheDocument()
    expect(screen.getByText(/Vigintillion-scale math/i)).toBeInTheDocument()
  })

  it('renders oracle daily prophecy alert when prediction state is set', () => {
    setupMocks(
      {},
      { oracleSide: 'left' },
      { notification: 'oracle', isHydrated: true }
    )
    render(<DashboardCard />)

    expect(screen.getByText('Daily Oracle Prophecy')).toBeInTheDocument()
    expect(screen.getByText('LEFT')).toBeInTheDocument()
  })

  it('renders notifications for newly unlocked automated betting capabilities', () => {
    setupMocks({}, {}, { notification: 'idle_unlock', isHydrated: true })
    render(<DashboardCard />)

    expect(screen.getByText('Auto-Bet Unlocked')).toBeInTheDocument()
    expect(screen.getByText(/Tick Auto-Bet Left or Right/i)).toBeInTheDocument()
  })
})
