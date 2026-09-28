import { render, screen, fireEvent, cleanup, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import RecoveryTutorial from '@/components/layout/RecoveryTutorial'
import {
  fetchRecoveryTutorialStatus,
  completeRecoveryTutorial
} from '@/lib/api'

vi.mock('@/lib/api', () => ({
  fetchRecoveryTutorialStatus: vi.fn(),
  completeRecoveryTutorial: vi.fn()
}))

describe('RecoveryTutorial', () => {
  const mockUserId = 'user-1'
  const mockProps = {
    userId: mockUserId,
    isOwnProfile: true,
    recoverySectionRef: { current: null }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.mocked(fetchRecoveryTutorialStatus).mockResolvedValue({
      recoveryTutorialCompleted: false
    })
    vi.mocked(completeRecoveryTutorial).mockResolvedValue({ success: true })
  })

  afterEach(() => {
    vi.useRealTimers()
    cleanup()
  })

  it("does not render for someone else's profile", async () => {
    render(<RecoveryTutorial {...mockProps} isOwnProfile={false} />)

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    expect(fetchRecoveryTutorialStatus).not.toHaveBeenCalled()
    expect(screen.queryByText('Protect Your Progress')).not.toBeInTheDocument()
  })

  it('does not render when the tutorial is already completed', async () => {
    vi.mocked(fetchRecoveryTutorialStatus).mockResolvedValue({
      recoveryTutorialCompleted: true
    })

    render(<RecoveryTutorial {...mockProps} />)

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    expect(fetchRecoveryTutorialStatus).toHaveBeenCalledWith(mockUserId)
    expect(screen.queryByText('Protect Your Progress')).not.toBeInTheDocument()
  })

  it('renders the tutorial when incomplete', async () => {
    render(<RecoveryTutorial {...mockProps} />)

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    expect(screen.getByText('Protect Your Progress')).toBeInTheDocument()
    expect(screen.getByText('VIEW CODE ON NETWORK')).toBeInTheDocument()
    expect(screen.getByText('Not now')).toBeInTheDocument()
  })

  it('dismisses the tutorial and sends completion request', async () => {
    render(<RecoveryTutorial {...mockProps} />)

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    const dismissButton = screen.getByText('Not now')
    await act(async () => {
      fireEvent.click(dismissButton)
    })

    expect(completeRecoveryTutorial).toHaveBeenCalledWith(mockUserId)
    expect(screen.queryByText('Protect Your Progress')).not.toBeInTheDocument()
  })
})
