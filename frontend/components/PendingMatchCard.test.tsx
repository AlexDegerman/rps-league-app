import { render, screen, fireEvent, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import PendingMatchCard from '@/components/PendingMatchCard'
import { PendingMatch, PredictionRecord } from '@/types/rps'

describe('PendingMatchCard', () => {
  const futureTime = Date.now() + 10000

  const mockPending: PendingMatch = {
    gameId: 'game-123',
    playerA: 'Alice',
    playerB: 'Bob',
    time: Date.now(),
    expiresAt: futureTime
  }

  const mockOnPick = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 2, 5, 0, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('renders player names and the vs separator', () => {
    render(
      <PendingMatchCard
        pending={mockPending}
        prediction={null}
        onPick={mockOnPick}
        serverOffset={0}
      />
    )

    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText(/vs/i)).toBeInTheDocument()
  })

  it('calls onPick with Alice when the first Bet button is clicked', async () => {
    render(
      <PendingMatchCard
        pending={mockPending}
        prediction={null}
        onPick={mockOnPick}
        serverOffset={0}
      />
    )

    const betButtons = screen.getAllByRole('button', { name: /Bet/i })

    fireEvent.click(betButtons[0])

    expect(mockOnPick).toHaveBeenCalledWith('game-123', 'Alice')
  })

  it('shows "Bet placed" and removes buttons when a prediction exists', () => {
    const mockPrediction: PredictionRecord = {
      gameId: 'game-123',
      pick: 'Bob'
    }

    render(
      <PendingMatchCard
        pending={mockPending}
        prediction={mockPrediction}
        onPick={mockOnPick}
        serverOffset={0}
      />
    )

    expect(
      screen.queryByRole('button', { name: /Bet/i })
    ).not.toBeInTheDocument()

    expect(screen.getByText(/Bet placed/i)).toBeInTheDocument()
  })

  it('counts down correctly as time expires', () => {
    const startTime = Date.now()
    const expiresAt = startTime + 10000

    render(
      <PendingMatchCard
        pending={{ ...mockPending, expiresAt }}
        prediction={null}
        onPick={mockOnPick}
        serverOffset={0}
      />
    )

    expect(screen.getByText(/10s left/i)).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(screen.getByText(/5s left/i)).toBeInTheDocument()
  })
})
