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
  fetchCurrentPredictorLeaderboard: vi.fn(),
  fetchWeeklyPredictorLeaderboard: vi.fn(),
  fetchPredictorLeaderboard: vi.fn(),
  fetchHistoricalLeaderboard: vi.fn(),
  fetchTodayLeaderboard: vi.fn()
}))

vi.mock('@/lib/user', () => ({
  getUserId: vi.fn()
}))

describe('LeaderboardPage', () => {
  const mockPredictors = [
    { user_id: 'user-1', nickname: 'Alice', points: 1000, wins: 5, losses: 2 },
    { user_id: 'my-id', nickname: 'Me', points: 500, wins: 2, losses: 5 }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    ;(user.getUserId as Mock).mockReturnValue('my-id')
    ;(api.fetchCurrentPredictorLeaderboard as Mock).mockResolvedValue(
      mockPredictors
    )
  })

  it('loads current predictors by default and identifies the "YOU" user', async () => {
    render(<LeaderboardPage />)

    expect(screen.getByText(/Loading/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(api.fetchCurrentPredictorLeaderboard).toHaveBeenCalled()
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('YOU')).toBeInTheDocument()
    })
  })

  it('switches to Weekly tab and updates the URL', async () => {
    ;(api.fetchWeeklyPredictorLeaderboard as Mock).mockResolvedValue([])
    render(<LeaderboardPage />)

    const weeklyBtn = screen.getByRole('button', { name: /weekly/i })
    fireEvent.click(weeklyBtn)

    await waitFor(() => {
      expect(api.fetchWeeklyPredictorLeaderboard).toHaveBeenCalled()
      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining('ps=weekly'),
        expect.any(Object)
      )
    })
  })

  it('initializes with All Time view if URL param is present', async () => {
    ;(useSearchParams as Mock).mockReturnValue(
      new URLSearchParams('ps=alltime')
    )
    ;(api.fetchPredictorLeaderboard as Mock).mockResolvedValue([])

    render(<LeaderboardPage />)

    await waitFor(() => {
      expect(api.fetchPredictorLeaderboard).toHaveBeenCalled()
      expect(api.fetchCurrentPredictorLeaderboard).not.toHaveBeenCalled()
    })
  })

  it('renders empty state message when no data is returned', async () => {
    ;(api.fetchCurrentPredictorLeaderboard as Mock).mockResolvedValue([])
    render(<LeaderboardPage />)

    await waitFor(() => {
      expect(screen.getByText(/No predictors yet/i)).toBeInTheDocument()
    })
  })
})
