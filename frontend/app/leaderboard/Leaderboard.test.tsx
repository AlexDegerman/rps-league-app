import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest'
import LeaderboardPage from '@/app/leaderboard/page'
import * as api from '@/lib/api'
import * as user from '@/lib/user'
import { useSearchParams } from 'next/navigation'

const mockReplace = vi.fn()

// 1. Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useRouter: vi.fn(() => ({ replace: mockReplace })),
  usePathname: vi.fn(() => '/leaderboard')
}))

// 2. Mock the API to match your actual implementation
vi.mock('@/lib/api', () => ({
  fetchUnifiedLeaderboard: vi.fn()
}))

vi.mock('@/lib/user', () => ({
  getUserId: vi.fn()
}))

describe('LeaderboardPage', () => {
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

  beforeEach(() => {
    vi.clearAllMocks()
    ;(user.getUserId as Mock).mockReturnValue('my-id')
    ;(api.fetchUnifiedLeaderboard as Mock).mockResolvedValue(mockPredictors)
  })

  it('loads daily predictors by default and identifies the "YOU" user', async () => {
    render(<LeaderboardPage />)

    // Check loading state (from the Suspense boundary or component)
    expect(screen.getByText(/Loading/i)).toBeInTheDocument()

    await waitFor(() => {
      // It should call the unified fetcher with default 'daily' params
      expect(api.fetchUnifiedLeaderboard).toHaveBeenCalledWith(
        'daily',
        'points',
        'desc'
      )
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('YOU')).toBeInTheDocument()
    })
  })

  it('switches to Weekly tab and updates the URL', async () => {
    render(<LeaderboardPage />)

    const weeklyBtn = screen.getByRole('button', { name: /weekly/i })
    fireEvent.click(weeklyBtn)

    await waitFor(() => {
      // Check if it calls the API with 'weekly'
      expect(api.fetchUnifiedLeaderboard).toHaveBeenCalledWith(
        'weekly',
        'gained',
        'desc'
      )
      // Check if URL updates using the correct key 'tab' (not 'ps')
      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining('tab=weekly'),
        expect.any(Object)
      )
    })
  })

  it('initializes with All Time view if URL param is present', async () => {
    // Set the search param to 'alltime'
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

  it('renders empty state message when no data is returned', async () => {
    // Force the mock to return the default (daily) for this specific test
    ;(useSearchParams as Mock).mockReturnValue(new URLSearchParams())

    ;(api.fetchUnifiedLeaderboard as Mock).mockResolvedValue([])

    render(<LeaderboardPage />)

    await waitFor(() => {
      // Using a more flexible regex that matches the start of any of your empty messages
      expect(screen.getByText(/No (predictors|bets)/i)).toBeInTheDocument()
    })
  })
})
