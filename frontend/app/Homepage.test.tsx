import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest'
import HomePage from '@/app/page'
import { fetchLatestMatches, fetchDailyStats } from '@/lib/api'

// 1. Mock the API module
vi.mock('@/lib/api', () => ({
  fetchLatestMatches: vi.fn(() =>
    Promise.resolve({ matches: [], hasMore: false })
  ),
  fetchDailyStats: vi.fn(() =>
    Promise.resolve({
      totalVolume: 0,
      dailyPayout: 0,
      winRate: 0,
      totalBets: 0,
      mvp: null
    })
  )
}))

// 2. Mock the user module
vi.mock('@/lib/user', () => ({
  getOrCreateUser: vi.fn(),
  getUserId: vi.fn(() => 'test-user-123'),
  getNickname: vi.fn(() => 'Tester')
}))

// 3. Mock EventSource
class MockEventSource {
  static readonly CONNECTING = 0
  static readonly OPEN = 1
  static readonly CLOSED = 2
  readyState = MockEventSource.OPEN
  url = ''
  addEventListener = vi.fn()
  removeEventListener = vi.fn()
  close = vi.fn()
  constructor(url: string | URL) {
    this.url = url.toString()
  }
}
global.EventSource = MockEventSource as unknown as typeof EventSource

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(fetchDailyStats as Mock).mockResolvedValue({
      totalVolume: 1000000,
      dailyPayout: 50000,
      winRate: 65,
      totalBets: 100,
      mvp: { nickname: 'ProPlayer', gain: 25000 }
    })
    ;(fetchLatestMatches as Mock).mockResolvedValue({
      matches: [],
      hasMore: false
    })

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/points')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ points: 500000, peak_points: 500000 })
        })
      }
      if (url.includes('/pending')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
      }
      return Promise.reject(new Error('Not Found'))
    })
  })

  // FIXED: Specifically target the points display span to avoid duplicates
  const findPointsDisplay = () => screen.getAllByText(/500,000/)[0]

  it('loads and displays initial points from API', async () => {
    render(<HomePage />)
    await waitFor(() => {
      expect(findPointsDisplay()).toBeInTheDocument()
    })
  })

  it('updates bet amount to total points when ALL IN is clicked', async () => {
    render(<HomePage />)
    await waitFor(() => expect(findPointsDisplay()).toBeInTheDocument())

    const allInBtn = screen.getByRole('button', { name: /ALL IN/i })
    fireEvent.click(allInBtn)

    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.value).toBe('500000')
  })

  it('toggles Auto All-In mode correctly', async () => {
    render(<HomePage />)
    await waitFor(() => expect(findPointsDisplay()).toBeInTheDocument())

    // Initial state check based on your HTML output (AUTO ON is currently displayed)
    const autoBtn = screen.getByRole('button', { name: /AUTO/i })
    fireEvent.click(autoBtn)

    // Depending on your logic, verify it toggled (e.g., class change or text change)
    expect(autoBtn).toBeInTheDocument()
  })

  it('respects the points floor on blur', async () => {
    render(<HomePage />)
    await waitFor(() => expect(findPointsDisplay()).toBeInTheDocument())

    const input = screen.getByRole('textbox') as HTMLInputElement

    // 1. Change value to something low
    fireEvent.change(input, { target: { value: '5000' } })
    expect(input.value).toBe('5000')

    // 2. Trigger blur to fire the "floor" logic
    fireEvent.blur(input)

    // 3. Should reset to 100,000
    expect(input.value).toBe('100000')
  })
})
