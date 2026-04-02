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
    // Set a fixed system time so the countdown is consistent
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

    // Your buttons literally say "Bet". Alice is usually the first one (index 0)
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

    // According to your debug log, the buttons disappear when a bet is placed
    expect(
      screen.queryByRole('button', { name: /Bet/i })
    ).not.toBeInTheDocument()

    // And "Bet placed" appears
    expect(screen.getByText(/Bet placed/i)).toBeInTheDocument()
  })

  it('counts down correctly as time expires', () => {
    // We need to re-calculate the mock with the current fake time
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

    // Check initial state (10s left)
    expect(screen.getByText(/10s left/i)).toBeInTheDocument()

    // Advance time by 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000)
    })

    // Should now show 5s left
    expect(screen.getByText(/5s left/i)).toBeInTheDocument()
  })
})
