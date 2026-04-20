import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import HomePage from './page'

// 1. Mock child components and hooks to isolate the test
vi.mock('@/components/LiveStatTicker', () => ({
  default: () => <div data-testid="mock-ticker" />
}))

vi.mock('@/hooks/useSound', () => ({
  useSound: () => ({
    playWin: vi.fn(),
    playLoss: vi.fn(),
    playCards: vi.fn(),
    playElectric: vi.fn(),
    playFire: vi.fn(),
    playMoon: vi.fn(),
    soundOn: true,
    toggleSound: vi.fn()
  })
}))

vi.mock('@/hooks/useInfiniteScroll', () => ({
  useInfiniteScroll: () => ({
    matches: [],
    setMatches: vi.fn(),
    hasMore: false,
    isLoadingMore: false,
    loadMatches: vi.fn()
  })
}))

vi.mock('@/hooks/useAnimatedBigInt', () => ({
  useAnimatedBigInt: (val: bigint) => val
}))

vi.mock('@/lib/EventThemeContext', () => ({
  useEventTheme: () => ({
    setLiveTheme: vi.fn(),
    setVisualMode: vi.fn()
  })
}))

// 2. Mock EventSource
class MockEventSource {
  static instances: MockEventSource[] = []
  listeners: Record<string, ((e: { data: string }) => void)[]> = {}
  close = vi.fn()
  constructor() {
    MockEventSource.instances.push(this)
  }
  addEventListener(event: string, callback: (e: { data: string }) => void) {
    if (!this.listeners[event]) this.listeners[event] = []
    this.listeners[event].push(callback)
  }
}
vi.stubGlobal('EventSource', MockEventSource)

const getBetInput = () => screen.getByRole('textbox') as HTMLInputElement

describe('HomePage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()

    // 3. Mock fetch with specific return shapes to prevent ".length" errors
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        // Mock points response
        if (url.includes('/api/users') && url.includes('/points')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                points: '500000',
                peakPoints: '500000',
                nickname: 'TestGuy',
                shortId: 'abc'
              })
          })
        }

        // Mock match history
        if (url.includes('/api/matches') && !url.includes('pending')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ matches: [], total: 0 })
          })
        }

        // Mock flash state
        if (url.includes('/flash-state')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ type: null, betsRemaining: 0 })
          })
        }

        // Mock pending matches & leaderboard (Returns arrays)
        if (url.includes('/pending') || url.includes('/leaderboard')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([])
          })
        }

        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })
    )
  })

  it('sets bet to full balance on load because AUTO defaults to true', async () => {
    render(<HomePage />)
    await waitFor(() => expect(getBetInput().value).toBe('500.000'))
  })

  it('clamps bet to 100k floor when AUTO is turned off', async () => {
    render(<HomePage />)
    await waitFor(() => expect(getBetInput().value).toBe('500.000'))
    fireEvent.click(screen.getByText(/AUTO ON/i))
    await waitFor(() => expect(getBetInput().value).toBe('100.000'))
  })

  it('toggles AUTO button state text', async () => {
    render(<HomePage />)
    const btn = await screen.findByText(/AUTO ON/i)
    fireEvent.click(btn)
    expect(await screen.findByText(/AUTO OFF/i)).toBeInTheDocument()
    fireEvent.click(screen.getByText(/AUTO OFF/i))
    expect(await screen.findByText(/AUTO ON/i)).toBeInTheDocument()
  })

  it('sets bet to full balance when ALL IN is clicked manually', async () => {
    render(<HomePage />)
    await waitFor(() => expect(getBetInput().value).toBe('500.000'))
    fireEvent.click(screen.getByText(/AUTO ON/i))
    await waitFor(() => expect(getBetInput().value).toBe('100.000'))
    fireEvent.click(screen.getByText(/ALL IN/i))
    await waitFor(() => expect(getBetInput().value).toBe('500.000'))
  })

  it('resets bet to floor when invalid low value is blurred', async () => {
    render(<HomePage />)
    await waitFor(() => expect(getBetInput().value).toBe('500.000'))
    fireEvent.click(screen.getByText(/AUTO ON/i))
    const input = getBetInput()
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: '10' } })
    fireEvent.blur(input)
    await waitFor(() => expect(input.value).toBe('100.000'))
  })
})
