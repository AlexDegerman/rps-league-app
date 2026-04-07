import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest'
import LeaderboardPage from '@/app/leaderboard/page'
import * as api from '@/lib/api'
import * as user from '@/lib/user'
import { useSearchParams } from 'next/navigation'

const mockReplace = vi.fn()

vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useRouter: vi.fn(() => ({ replace: mockReplace })),
  usePathname: vi.fn(() => '/leaderboard')
}))

vi.mock('@/lib/api', () => ({
  fetchUnifiedLeaderboard: vi.fn()
}))

vi.mock('@/lib/user', () => ({
  getUserId: vi.fn()
}))

const mockPredictors = [
  {
    user_id: 'user-1',
    nickname: 'Alice',
    points: 1000,
    peak_points: 1100,
    gained: 100,
    wins: 5,
    losses: 2,
    win_rate: 71
  },
  {
    user_id: 'my-id',
    nickname: 'Me',
    points: 500,
    peak_points: 600,
    gained: -50,
    wins: 2,
    losses: 5,
    win_rate: 28
  }
]

describe('LeaderboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(user.getUserId as Mock).mockReturnValue('my-id')
    ;(api.fetchUnifiedLeaderboard as Mock).mockResolvedValue(mockPredictors)
    ;(useSearchParams as Mock).mockReturnValue(new URLSearchParams())
  })

  it('fetches daily data by default and marks the current user as YOU', async () => {
    render(<LeaderboardPage />)

    expect(screen.getByText(/Loading/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(api.fetchUnifiedLeaderboard).toHaveBeenCalledWith(
        'daily',
        'points',
        'desc'
      )
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('YOU')).toBeInTheDocument()
    })
  })

  it('refetches with weekly params and updates URL when Weekly tab is clicked', async () => {
    render(<LeaderboardPage />)

    fireEvent.click(screen.getByRole('button', { name: /weekly/i }))

    await waitFor(() => {
      expect(api.fetchUnifiedLeaderboard).toHaveBeenCalledWith(
        'weekly',
        'gained',
        'desc'
      )
      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining('tab=weekly'),
        expect.any(Object)
      )
    })
  })

  it('reads tab from URL param on mount and fetches alltime data', async () => {
    ;(useSearchParams as Mock).mockReturnValue(
      new URLSearchParams('tab=alltime')
    )

    render(<LeaderboardPage />)

    await waitFor(() => {
      expect(api.fetchUnifiedLeaderboard).toHaveBeenCalledWith(
        'alltime',
        'peak',
        'desc'
      )
    })
  })

  it('shows empty state when API returns no predictors', async () => {
    ;(api.fetchUnifiedLeaderboard as Mock).mockResolvedValue([])

    render(<LeaderboardPage />)

    await waitFor(() => {
      expect(screen.getByText(/No (predictors|bets)/i)).toBeInTheDocument()
    })
  })
})
