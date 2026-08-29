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
import React from 'react'
import MatchFeed from '@/components/game/MatchFeed'
import MatchList from '@/components/game/MatchList'

interface StoreMock extends Mock {
  getState: Mock
}

const {
  mockUserStore,
  mockGameStore,
  mockUIStore,
  mockPostPrediction,
  mockUser
} = vi.hoisted(() => {
  const createMockStore = () => {
    const mock = vi.fn() as unknown as StoreMock
    mock.getState = vi.fn()
    return mock
  }

  return {
    mockUserStore: createMockStore(),
    mockGameStore: createMockStore(),
    mockUIStore: createMockStore(),
    mockPostPrediction: vi.fn(),
    mockUser: { userId: 'user_123', nickname: 'TestUser', shortId: 'abc' }
  }
})

vi.mock('@/app/stores/userStore', () => ({ useUserStore: mockUserStore }))
vi.mock('@/app/stores/gameStore', () => ({ useGameStore: mockGameStore }))
vi.mock('@/app/stores/uiStore', () => ({ useUIStore: mockUIStore }))

vi.mock('@/components/game/PendingMatchCard', () => ({
  default: ({
    pending,
    onPick
  }: {
    pending: {
      gameId: string
      playerA: { name: string }
      playerB: { name: string }
    }
    onPick: (gameId: string, playerName: string) => void
  }) => (
    <div data-testid={`pending-${pending.gameId}`}>
      <span>
        {pending.playerA.name} vs {pending.playerB.name}
      </span>
      <button onClick={() => onPick(pending.gameId, pending.playerA.name)}>
        Pick {pending.playerA.name}
      </button>
    </div>
  )
}))

vi.mock('@/lib/user', () => ({
  getOrCreateUser: vi.fn(() => mockUser),
  isUserValid: vi.fn(() => true)
}))

vi.mock('@/lib/oracleTTS', () => ({
  unlockOracle: vi.fn()
}))

vi.mock('@/lib/api', () => ({
  postPrediction: mockPostPrediction
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn()
  }
}))

const mockSetPrediction = vi.fn()
const mockUpdatePrediction = vi.fn()
const mockDeletePrediction = vi.fn()
const mockSetOracleSide = vi.fn()
const mockTriggerError = vi.fn()

const setupMocks = (
  userOverrides = {},
  gameOverrides = {},
  uiOverrides = {}
) => {
  const userState = {
    betAmount: 50000n,
    winStreak: 0,
    ...userOverrides
  }

  const gameState = {
    pendingMatches: [
      {
        gameId: 'game_1',
        expiresAt: Date.now() + 10000,
        playerA: { name: 'PlayerOne', played: 'ROCK' },
        playerB: { name: 'PlayerTwo', played: 'SCISSORS' }
      }
    ],
    predictions: new Map(),
    serverOffset: 0,
    festivalModeKey: null,
    oracleSide: null,
    setPrediction: mockSetPrediction,
    updatePrediction: mockUpdatePrediction,
    deletePrediction: mockDeletePrediction,
    setOracleSide: mockSetOracleSide,
    ...gameOverrides
  }

  const uiState = {
    notification: null,
    triggerError: mockTriggerError,
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

describe('Match Component Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  afterEach(cleanup)

  describe('MatchFeed', () => {
    it('handles successful prediction flow', async () => {
      mockPostPrediction.mockResolvedValue({
        ok: true,
        data: { success: true }
      })

      render(
        <MatchFeed
          visualMode={null}
          matches={[]}
          isLoadingMore={false}
          hasMore={false}
          backendReady={true}
          persistentError={null}
          isDuplicate={false}
          showConnectionWarning={false}
          isOffline={false}
        />
      )

      const button = await screen.findByRole('button', {
        name: 'Pick PlayerOne'
      })
      await act(async () => {
        fireEvent.click(button)
      })

      expect(mockSetPrediction).toHaveBeenCalledWith('game_1', {
        gameId: 'game_1',
        pick: 'PlayerOne',
        confirmed: false,
        totalMultiplier: 1
      })

      await waitFor(() => {
        expect(mockUpdatePrediction).toHaveBeenCalledWith('game_1', {
          confirmed: true
        })
      })
      expect(mockDeletePrediction).not.toHaveBeenCalled()
    })

    it('handles failed prediction flow', async () => {
      mockPostPrediction.mockResolvedValue({
        ok: false,
        data: { success: false, error: 'MATCH ALREADY ENDED' }
      })

      render(
        <MatchFeed
          visualMode={null}
          matches={[]}
          isLoadingMore={false}
          hasMore={false}
          backendReady={true}
          persistentError={null}
          isDuplicate={false}
          showConnectionWarning={false}
          isOffline={false}
        />
      )

      const button = await screen.findByRole('button', {
        name: 'Pick PlayerOne'
      })
      await act(async () => {
        fireEvent.click(button)
      })

      await waitFor(() => {
        expect(mockTriggerError).toHaveBeenCalledWith('MATCH ALREADY ENDED')
      })
      expect(mockDeletePrediction).toHaveBeenCalledWith('game_1')
      expect(mockUpdatePrediction).not.toHaveBeenCalled()
    })

    it('handles timeout prediction flow', async () => {
      const abortError = new Error('AbortError')
      abortError.name = 'AbortError'
      mockPostPrediction.mockRejectedValue(abortError)

      render(
        <MatchFeed
          visualMode={null}
          matches={[]}
          isLoadingMore={false}
          hasMore={false}
          backendReady={true}
          persistentError={null}
          isDuplicate={false}
          showConnectionWarning={false}
          isOffline={false}
        />
      )

      const button = await screen.findByRole('button', {
        name: 'Pick PlayerOne'
      })
      await act(async () => {
        fireEvent.click(button)
      })

      await waitFor(() => {
        expect(mockTriggerError).toHaveBeenCalledWith('CONNECTION TOO SLOW')
      })
      expect(mockDeletePrediction).toHaveBeenCalledWith('game_1')
    })
  })

  describe('MatchList / MatchRow', () => {
    const mockMatches = [
      {
        gameId: 'game_match_1',
        time: Date.now(),
        type: 'GAME_RESULT',
        playerA: { name: 'PlayerOne', played: 'ROCK' as const },
        playerB: { name: 'PlayerTwo', played: 'SCISSORS' as const },
        outcomeRewritten: false
      }
    ]

    it('renders list of matches correctly', () => {
      render(
        <MatchList
          matches={mockMatches}
          isLoadingMore={false}
          hasMore={true}
          predictions={new Map()}
        />
      )

      expect(screen.getByText('PlayerOne')).toBeInTheDocument()
      expect(screen.getByText('PlayerTwo')).toBeInTheDocument()
    })

    it('displays prediction result correctly', () => {
      const mockPredictions = new Map([
        [
          'game_match_1',
          {
            gameId: 'game_match_1',
            result: 'WIN' as const,
            pick: 'PlayerOne',
            confirmed: true,
            totalMultiplier: 1
          }
        ]
      ])

      render(
        <MatchList
          matches={mockMatches}
          isLoadingMore={false}
          hasMore={true}
          predictions={mockPredictions}
        />
      )

      expect(screen.getByText('✨ You won!')).toBeInTheDocument()
    })

    it('displays loading and reached the end states correctly', () => {
      const { rerender } = render(
        <MatchList
          matches={mockMatches}
          isLoadingMore={true}
          hasMore={true}
          predictions={new Map()}
        />
      )

      expect(screen.getByText('Loading more...')).toBeInTheDocument()

      rerender(
        <MatchList
          matches={mockMatches}
          isLoadingMore={false}
          hasMore={false}
          predictions={new Map()}
        />
      )

      expect(screen.getByText("You've reached the end")).toBeInTheDocument()
    })

    it('evaluates correct Rock-Paper-Scissors winner logic', () => {
      const rockVsScissors = [
        {
          gameId: 'match_rock_scissors',
          time: Date.now(),
          type: 'GAME_RESULT',
          playerA: { name: 'PlayerOne', played: 'ROCK' as const },
          playerB: { name: 'PlayerTwo', played: 'SCISSORS' as const },
          outcomeRewritten: false
        }
      ]

      const { rerender } = render(
        <MatchList
          matches={rockVsScissors}
          isLoadingMore={false}
          hasMore={true}
          predictions={new Map()}
        />
      )

      expect(screen.getByText('PlayerOne wins')).toBeInTheDocument()

      const scissorsVsPaper = [
        {
          gameId: 'match_scissors_paper',
          time: Date.now(),
          type: 'GAME_RESULT',
          playerA: { name: 'PlayerOne', played: 'SCISSORS' as const },
          playerB: { name: 'PlayerTwo', played: 'PAPER' as const },
          outcomeRewritten: false
        }
      ]

      rerender(
        <MatchList
          matches={scissorsVsPaper}
          isLoadingMore={false}
          hasMore={true}
          predictions={new Map()}
        />
      )

      expect(screen.getByText('PlayerOne wins')).toBeInTheDocument()

      const paperVsRock = [
        {
          gameId: 'match_paper_rock',
          time: Date.now(),
          type: 'GAME_RESULT',
          playerA: { name: 'PlayerOne', played: 'PAPER' as const },
          playerB: { name: 'PlayerTwo', played: 'ROCK' as const },
          outcomeRewritten: false
        }
      ]

      rerender(
        <MatchList
          matches={paperVsRock}
          isLoadingMore={false}
          hasMore={true}
          predictions={new Map()}
        />
      )

      expect(screen.getByText('PlayerOne wins')).toBeInTheDocument()
    })
  })
})
