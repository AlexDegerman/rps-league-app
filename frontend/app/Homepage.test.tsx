import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import HomePage from './page'

class MockEventSource {
  static instances: MockEventSource[] = []
  listeners: Record<string, ((e: { data: string }) => void)[]> = {}
  close = vi.fn()

  constructor(public url: string) {
    MockEventSource.instances.push(this)
  }

  addEventListener(event: string, callback: (e: { data: string }) => void) {
    if (!this.listeners[event]) this.listeners[event] = []
    this.listeners[event].push(callback)
  }

  emit(event: string, data: object) {
    this.listeners[event]?.forEach((cb) => cb({ data: JSON.stringify(data) }))
  }
}

vi.stubGlobal('EventSource', MockEventSource)

const getBetInput = () => screen.getByRole('textbox') as HTMLInputElement

describe('HomePage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    MockEventSource.instances = []
    localStorage.clear()

    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        // Points endpoint — camelCase to match updated API response
        if (url.includes('/api/users') && url.includes('/points')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                points: '500000',
                peakPoints: '500000',
                dailyPeak: '500000',
                weeklyPeak: '500000'
              })
          })
        }
        // Daily stats for LiveStatsTicker
        if (url.includes('/api/predictions/stats/daily')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                totalVolume: '1000000',
                dailyPayout: '500000',
                winRate: 55,
                totalBets: 1234,
                mvp: { nickname: 'Player1', gain: '200000' }
              })
          })
        }
        // Pending matches
        if (url.includes('/api/matches/pending')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([])
          })
        }
        // Match history
        if (url.includes('/api/matches')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ matches: [], total: 0 })
          })
        }
        return Promise.reject(new Error(`Unhandled fetch: ${url}`))
      })
    )
  })

  it('sets bet to full balance on load because AUTO ALL-IN defaults to on', async () => {
    render(<HomePage />)
    // AUTO is on by default → bet = full points balance (500k)
    await waitFor(() => expect(getBetInput().value).toBe('500.000'))
    await waitFor(() => expect(screen.getByText(/499|500/)).toBeInTheDocument())
  })

  it('clamps bet to 100k floor when AUTO is turned off', async () => {
    render(<HomePage />)
    await waitFor(() => expect(getBetInput().value).toBe('500.000'))

    fireEvent.click(screen.getByRole('button', { name: /AUTO/i }))
    await waitFor(() => expect(getBetInput().value).toBe('100.000'))
  })

  it('sets bet to full balance when ALL IN is clicked', async () => {
    render(<HomePage />)
    await waitFor(() => expect(getBetInput().value).toBe('500.000'))

    fireEvent.click(screen.getByRole('button', { name: /AUTO/i }))
    await waitFor(() => expect(getBetInput().value).toBe('100.000'))

    fireEvent.click(screen.getByRole('button', { name: /ALL IN/i }))
    await waitFor(() => expect(getBetInput().value).toBe('500.000'))
  })

  it('toggles AUTO button class between on and off states', async () => {
    render(<HomePage />)
    const autoButton = screen.getByRole('button', { name: /AUTO/i })

    expect(autoButton).toHaveClass('bg-green-600')
    fireEvent.click(autoButton)
    await waitFor(() => expect(autoButton).not.toHaveClass('bg-green-600'))
    fireEvent.click(autoButton)
    await waitFor(() => expect(autoButton).toHaveClass('bg-green-600'))
  })

  it('resets bet to 100k floor when a below-floor value is entered and blurred (AUTO off)', async () => {
    render(<HomePage />)
    await waitFor(() => expect(getBetInput().value).toBe('500.000'))

    fireEvent.click(screen.getByRole('button', { name: /AUTO/i }))
    await waitFor(() => expect(getBetInput().value).toBe('100.000'))

    fireEvent.focus(getBetInput())
    fireEvent.change(getBetInput(), { target: { value: '50000' } })
    fireEvent.blur(getBetInput())

    await waitFor(() => expect(getBetInput().value).toBe('100.000'))
  })

  it('syncs bet input to full balance when AUTO ALL-IN is re-enabled', async () => {
    render(<HomePage />)
    await waitFor(() => expect(getBetInput().value).toBe('500.000'))

    fireEvent.click(screen.getByRole('button', { name: /AUTO/i }))
    await waitFor(() => expect(getBetInput().value).toBe('100.000'))

    fireEvent.click(screen.getByRole('button', { name: /AUTO/i }))
    await waitFor(() => expect(getBetInput().value).toBe('500.000'))
  })
})
