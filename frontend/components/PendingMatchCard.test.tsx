import { render, screen, fireEvent, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import PendingMatchCard from '@/components/PendingMatchCard'
import type { PendingMatch, PredictionRecord } from '@/types/rps'

describe('PendingMatchCard', () => {
  const NOW = new Date(2026, 3, 2, 5, 0, 0).getTime()

  const mockPending: PendingMatch = {
    gameId: 'game-123',
    playerA: 'Alice',
    playerB: 'Bob',
    time: NOW,
    expiresAt: NOW + 10000
  }

  const mockOnPick = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('renders both player names and the vs separator', () => {
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

  it('calls onPick with the correct player when a Bet button is clicked', () => {
    render(
      <PendingMatchCard
        pending={mockPending}
        prediction={null}
        onPick={mockOnPick}
        serverOffset={0}
      />
    )
    // First button corresponds to playerA (Alice)
    fireEvent.click(screen.getAllByRole('button', { name: /Bet/i })[0])
    expect(mockOnPick).toHaveBeenCalledWith('game-123', 'Alice')
  })

  it('hides Bet buttons and shows confirmation when a prediction is already placed', () => {
    const prediction: PredictionRecord = {
      gameId: 'game-123',
      pick: 'Bob',
      confirmed: true
    }

    render(
      <PendingMatchCard
        pending={mockPending}
        prediction={prediction}
        onPick={mockOnPick}
        serverOffset={0}
      />
    )

    expect(
      screen.queryByRole('button', { name: /Bet/i })
    ).not.toBeInTheDocument()
    expect(screen.getByText(/Bet placed/i)).toBeInTheDocument()
  })

  it('counts down the timer as time advances', () => {
    render(
      <PendingMatchCard
        pending={mockPending}
        prediction={null}
        onPick={mockOnPick}
        serverOffset={0}
      />
    )

    expect(screen.getByText(/10s left/i)).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(5000))

    expect(screen.getByText(/5s left/i)).toBeInTheDocument()
  })
})
