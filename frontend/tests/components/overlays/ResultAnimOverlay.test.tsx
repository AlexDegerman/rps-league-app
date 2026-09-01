import { render, screen, cleanup, act } from '@testing-library/react'
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock
} from 'vitest'
import ResultAnimOverlay from '@/components/overlays/ResultAnimOverlay'
import { ResultAnim } from '@/types/prediction'
import { GlobalEventType } from '@/types/events'

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

const mockPlayJackpot = vi.fn()
vi.mock('@/hooks/useSound', () => ({
  useSound: () => ({
    playJackpot: mockPlayJackpot
  })
}))

const setupMocks = (
  userOverrides = {},
  gameOverrides = {},
  uiOverrides = {}
) => {
  const userState = {
    stylePreference: 'default',
    ...userOverrides
  }

  const gameState = {
    festivalType: null,
    activeFestival: false,
    ...gameOverrides
  }

  const uiState = {
    oracleTTSEnabled: true,
    oracleVolume: 0.88,
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

describe('ResultAnimOverlay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  afterEach(cleanup)

  it('renders positive animated result on win', () => {
    const resultAnim = {
      win: true,
      amount: 50000n,
      confetti: []
    } as unknown as ResultAnim

    render(
      <ResultAnimOverlay
        resultAnim={resultAnim}
        streakMult={1}
        animatedResult={50000n}
      />
    )

    expect(screen.getByText('+')).toBeInTheDocument()
    expect(screen.getByText(/50[.,]000/)).toBeInTheDocument()
  })

  it('renders negative animated result on loss', () => {
    const resultAnim = {
      win: false,
      amount: 25000n
    } as unknown as ResultAnim

    render(
      <ResultAnimOverlay
        resultAnim={resultAnim}
        streakMult={1}
        animatedResult={25000n}
      />
    )

    expect(screen.getByText('-')).toBeInTheDocument()
    expect(screen.getByText(/25[.,]000/)).toBeInTheDocument()
  })

  it('renders correct bonus tier label and multiplier when bonus is present', () => {
    const resultAnim = {
      win: true,
      amount: 100000n,
      bonus: {
        tier: 'MYTHICAL',
        amount: 15000n,
        visualMultiplier: 1500
      },
      confetti: []
    } as unknown as ResultAnim

    render(
      <ResultAnimOverlay
        resultAnim={resultAnim}
        streakMult={1}
        animatedResult={100000n}
      />
    )

    expect(screen.getByText(/MYTHICAL BONUS\s*15\.0x/i)).toBeInTheDocument()
    expect(screen.getByText(/15[.,]000/)).toBeInTheDocument()
  })

  it('renders Lucky Save and bonus amount on a losing bonus result', () => {
    const resultAnim = {
      win: false,
      amount: 20000n,
      bonus: {
        tier: 'LEGENDARY',
        amount: 10000n,
        visualMultiplier: 500
      }
    } as unknown as ResultAnim

    render(
      <ResultAnimOverlay
        resultAnim={resultAnim}
        streakMult={1}
        animatedResult={20000n}
      />
    )

    expect(screen.getByText('Lucky Save')).toBeInTheDocument()
    expect(screen.getByText(/10[.,]000/)).toBeInTheDocument()
  })

  it('renders streak bonus badge only at 3+ win streak', () => {
    const resultAnim = {
      win: true,
      amount: 10000n,
      streakAfter: 2,
      confetti: []
    } as unknown as ResultAnim

    const { rerender } = render(
      <ResultAnimOverlay
        resultAnim={resultAnim}
        streakMult={1}
        animatedResult={10000n}
      />
    )

    expect(screen.queryByText(/STREAK BONUS/i)).not.toBeInTheDocument()

    const updatedAnim = {
      ...resultAnim,
      streakAfter: 3
    } as unknown as ResultAnim

    rerender(
      <ResultAnimOverlay
        resultAnim={updatedAnim}
        streakMult={2}
        animatedResult={10000n}
      />
    )

    expect(screen.getByText(/x2 STREAK BONUS/i)).toBeInTheDocument()
  })

  it('renders correct festival win/loss effects based on the active festival', () => {
    setupMocks({}, { activeFestival: true, festivalType: 'SURGE' })
    const winAnim = {
      win: true,
      amount: 10000n,
      confetti: []
    } as unknown as ResultAnim

    const { rerender } = render(
      <ResultAnimOverlay
        resultAnim={winAnim}
        streakMult={1}
        animatedResult={10000n}
      />
    )

    expect(screen.getByText('SURGE FESTIVAL')).toBeInTheDocument()
    expect(screen.getByText('2x all wins')).toBeInTheDocument()

    setupMocks({}, { activeFestival: true, festivalType: 'SAFEGUARD' })
    const lossAnim = {
      win: false,
      amount: 5000n
    } as unknown as ResultAnim

    rerender(
      <ResultAnimOverlay
        resultAnim={lossAnim}
        streakMult={1}
        animatedResult={5000n}
      />
    )

    expect(screen.getByText('SAFEGUARD FESTIVAL')).toBeInTheDocument()
    expect(screen.getByText('loss deduction 40%')).toBeInTheDocument()
  })

  it('calculates the correct echo percentage for MIRAGE_CATACLYSM', () => {
    const resultAnim = {
      win: true,
      amount: 120000n,
      globalEventType: 'MIRAGE_CATACLYSM' as GlobalEventType,
      globalEchoAmount: 20000n,
      confetti: []
    } as unknown as ResultAnim

    render(
      <ResultAnimOverlay
        resultAnim={resultAnim}
        streakMult={1}
        animatedResult={120000n}
      />
    )

    expect(screen.getByText('MIRAGE CATACLYSM')).toBeInTheDocument()
    expect(screen.getByText('+20% echo')).toBeInTheDocument()
  })

  it('triggers relic slam after timeout and hides normal result rendering', () => {
    vi.useFakeTimers()

    const resultAnim = {
      win: true,
      amount: 300000n,
      soulProc: true,
      preSoulAmount: 100000n,
      confetti: []
    } as unknown as ResultAnim

    const { container } = render(
      <ResultAnimOverlay
        resultAnim={resultAnim}
        streakMult={1}
        animatedResult={300000n}
      />
    )

    const resultContainer = container.querySelector(
      '.result-number-wrap > span'
    )
    expect(resultContainer?.className).not.toContain('opacity-0')
    expect(mockPlayJackpot).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(2400)
    })

    expect(mockPlayJackpot).toHaveBeenCalled()
    expect(resultContainer?.className).toContain('opacity-0')

    vi.useRealTimers()
  })
})
