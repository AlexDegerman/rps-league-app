import { render, screen, cleanup, act, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import RecoveryTutorial from '@/components/layout/RecoveryTutorial'
import {
  fetchRecoveryTutorialStatus,
  completeRecoveryTutorial
} from '@/lib/api'

vi.mock('@/lib/api', () => ({
  fetchRecoveryTutorialStatus: vi.fn(),
  completeRecoveryTutorial: vi.fn()
}))

const mockScrollTo = vi.fn()
vi.stubGlobal('scrollTo', mockScrollTo)
vi.stubGlobal('innerHeight', 1000)
vi.stubGlobal('pageYOffset', 100)
vi.stubGlobal('scrollY', 100)

describe('RecoveryTutorial', () => {
  let mockRefElement: HTMLDivElement
  let ref: React.RefObject<HTMLDivElement | null>
  let mockGetBoundingClientRect: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    mockGetBoundingClientRect = vi.fn().mockReturnValue({
      top: 800,
      bottom: 1000,
      left: 100,
      right: 300,
      width: 200,
      height: 200
    })

    mockRefElement = {
      getBoundingClientRect: mockGetBoundingClientRect
    } as unknown as HTMLDivElement

    ref = { current: mockRefElement }
  })

  afterEach(() => {
    vi.useRealTimers()
    cleanup()
  })

  it('does not render for someone else’s profile', async () => {
    render(
      <RecoveryTutorial
        userId="user-1"
        isOwnProfile={false}
        recoverySectionRef={ref}
      />
    )

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    expect(fetchRecoveryTutorialStatus).not.toHaveBeenCalled()
    expect(screen.queryByText('Profile Security')).not.toBeInTheDocument()
  })

  it('does not render when the tutorial is already completed', async () => {
    vi.mocked(fetchRecoveryTutorialStatus).mockResolvedValue({
      recoveryTutorialCompleted: true
    })

    render(
      <RecoveryTutorial
        userId="user-1"
        isOwnProfile={true}
        recoverySectionRef={ref}
      />
    )

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    expect(fetchRecoveryTutorialStatus).toHaveBeenCalledWith('user-1')
    expect(screen.queryByText('Profile Security')).not.toBeInTheDocument()
  })

  it('renders the tutorial when incomplete', async () => {
    vi.mocked(fetchRecoveryTutorialStatus).mockResolvedValue({
      recoveryTutorialCompleted: false
    })

    render(
      <RecoveryTutorial
        userId="user-1"
        isOwnProfile={true}
        recoverySectionRef={ref}
      />
    )

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    expect(screen.getByText('Profile Security')).toBeInTheDocument()
    expect(screen.getByText('Recovery Access')).toBeInTheDocument()
    expect(
      screen.getByText(
        /Your recovery code is the only way to restore your progress/i
      )
    ).toBeInTheDocument()
    expect(screen.getByText('Got It')).toBeInTheDocument()
  })

  it('scrolls to the recovery section when the tutorial becomes visible', async () => {
    vi.mocked(fetchRecoveryTutorialStatus).mockResolvedValue({
      recoveryTutorialCompleted: false
    })

    render(
      <RecoveryTutorial
        userId="user-1"
        isOwnProfile={true}
        recoverySectionRef={ref}
      />
    )

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    expect(mockScrollTo).toHaveBeenCalledWith({
      top: 250,
      behavior: 'smooth'
    })
  })

  it('dismisses the tutorial, sends completion request, and restores original scroll position', async () => {
    vi.mocked(fetchRecoveryTutorialStatus).mockResolvedValue({
      recoveryTutorialCompleted: false
    })

    render(
      <RecoveryTutorial
        userId="user-1"
        isOwnProfile={true}
        recoverySectionRef={ref}
      />
    )

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    mockScrollTo.mockClear()

    const gotItButton = screen.getByText('Got It')

    await act(async () => {
      fireEvent.click(gotItButton)
    })

    expect(screen.queryByText('Profile Security')).not.toBeInTheDocument()
    expect(completeRecoveryTutorial).toHaveBeenCalledWith('user-1')

    await act(async () => {
      vi.advanceTimersByTime(200)
    })

    expect(mockScrollTo).toHaveBeenCalledWith({
      top: 100,
      behavior: 'smooth'
    })
  })

  it('recalculates the highlighted section position when scroll and resize events fire', async () => {
    vi.mocked(fetchRecoveryTutorialStatus).mockResolvedValue({
      recoveryTutorialCompleted: false
    })

    render(
      <RecoveryTutorial
        userId="user-1"
        isOwnProfile={true}
        recoverySectionRef={ref}
      />
    )

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    mockGetBoundingClientRect.mockClear()

    await act(async () => {
      fireEvent.scroll(window)
    })

    expect(mockGetBoundingClientRect).toHaveBeenCalled()

    mockGetBoundingClientRect.mockClear()

    await act(async () => {
      fireEvent.resize(window)
    })

    expect(mockGetBoundingClientRect).toHaveBeenCalled()
  })
})
