import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest'
import HomePage from '@/app/page'
import { fetchLatestMatches } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  fetchLatestMatches: vi.fn()
}))

vi.mock('@/lib/user', () => ({
  getOrCreateUser: vi.fn(),
  getUserId: vi.fn(() => 'test-user-123')
}))

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    const mockedFetch = fetchLatestMatches as Mock
    mockedFetch.mockResolvedValue({
      matches: [],
      hasMore: false
    })

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ points: 5000, peak_points: 5000 })
    })
  })

  it('updates bet amount to total points when ALL IN is clicked', async () => {
    render(<HomePage />)

    await waitFor(() => {
      expect(screen.getByText('5,000')).toBeInTheDocument()
    })

    const allInBtn = screen.getByRole('button', { name: /ALL IN/i })

    await act(async () => {
      fireEvent.click(allInBtn)
    })

    const input = screen.getByRole('spinbutton') as HTMLInputElement
    expect(input.value).toBe('5000')
  })

  it('loads and displays initial points from API', async () => {
    render(<HomePage />)

    await waitFor(() => {
      expect(screen.getByText('5,000')).toBeInTheDocument()
    })
  })

  it('toggles Auto All-In mode correctly', async () => {
    render(<HomePage />)

    await waitFor(() => expect(screen.getByText('5,000')).toBeInTheDocument())

    const autoBtn = screen.getByRole('button', { name: /AUTO OFF/i })

    await act(async () => {
      fireEvent.click(autoBtn)
    })

    expect(screen.getByText(/AUTO ON/i)).toBeInTheDocument()
  })

  it('handles the UI state after ALL IN', async () => {
    render(<HomePage />)

    await waitFor(() => expect(screen.getByText('5,000')).toBeInTheDocument())

    const allInBtn = screen.getByRole('button', { name: /ALL IN/i })

    await act(async () => {
      fireEvent.click(allInBtn)
    })

    const input = screen.getByRole('spinbutton') as HTMLInputElement
    expect(input.value).toBe('5000')
  })
})
