import { render, screen, cleanup, act } from '@testing-library/react'
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock
} from 'vitest'
import WorldBossArena from '@/components/game/WorldBossArena'
import { drainBurstEvents } from '@/lib/worldBossFeed'
import { WorldBossType } from '@/types/worldboss'

interface StoreMock extends Mock {
  getState: Mock
}

const { mockGameStore, mockPlayBossAttack, mockPlayBossTakeDmg } = vi.hoisted(
  () => {
    const createMockStore = () => {
      const mock = vi.fn() as unknown as StoreMock
      mock.getState = vi.fn()
      return mock
    }
    return {
      mockGameStore: createMockStore(),
      mockPlayBossAttack: vi.fn(),
      mockPlayBossTakeDmg: vi.fn()
    }
  }
)

vi.mock('@/app/stores/gameStore', () => ({ useGameStore: mockGameStore }))

vi.mock('@/hooks/useSound', () => ({
  useSound: () => ({
    playBossAttack: mockPlayBossAttack,
    playBossTakeDmg: mockPlayBossTakeDmg
  })
}))

vi.mock('@/lib/worldBossFeed', () => ({
  drainBurstEvents: vi.fn()
}))

vi.mock('@/components/ui/SoundControlButton', () => ({
  default: () => <button data-testid="sound-btn" />
}))

const setupMocks = (overrides = {}) => {
  const state = {
    worldBossType: 'HEXURION' as WorldBossType,
    worldBossHpPct: 100,
    worldBossMaxHp: 1000,
    worldBossStrikeCount: 12345,
    worldBossTopDamagers: [
      { userId: 'u1', nickname: 'DmgLeader', damageDealt: 300, rank: 1 }
    ],
    worldBossMyRank: 4,
    worldBossEncounterEndsAt: Date.now() + 60000,
    lastBossHitResult: null,
    lastBossHitDamage: 0,
    clearLastBossHitResult: vi.fn(),
    worldBossParticipantCount: 15,
    ...overrides
  }

  mockGameStore.mockImplementation(<T,>(selector?: (s: typeof state) => T) =>
    selector ? selector(state) : state
  )
  mockGameStore.getState.mockReturnValue(state)
}

describe('WorldBossArena', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
    vi.mocked(drainBurstEvents).mockReturnValue([])
  })

  afterEach(cleanup)

  it('renders nothing when bossType is missing', () => {
    setupMocks({ worldBossType: null })
    const { container } = render(<WorldBossArena serverOffset={0} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the correct model for each boss type', () => {
    const types = ['HEXURION', 'ORPHION', 'FRACTURON', 'APEXION'] as const
    const containerClasses = [
      '.hexurion-container',
      '.orphion-container',
      '.fracturon-container',
      '.apexion-container'
    ]

    types.forEach((type, idx) => {
      setupMocks({ worldBossType: type })
      const { container } = render(<WorldBossArena serverOffset={0} />)
      const expectedClass = containerClasses[idx]!
      expect(container.querySelector(expectedClass)).toBeInTheDocument()
      cleanup()
    })
  })

  it('transitions from initial assembling state to idle state after timeout', () => {
    vi.useFakeTimers()
    setupMocks({ worldBossType: 'HEXURION' })
    const { container } = render(<WorldBossArena serverOffset={0} />)

    const model = container.querySelector('.hexurion-model')
    expect(model?.className).toContain('assembling')

    act(() => {
      vi.advanceTimersByTime(1400)
    })

    const containerEl = container.querySelector('.hexurion-container')
    expect(containerEl?.className).toContain('idle')
    expect(model?.className).not.toContain('assembling')
    vi.useRealTimers()
  })

  it('transitions the boss to dying state when HP reaches zero', () => {
    setupMocks({
      worldBossType: 'HEXURION',
      worldBossHpPct: 0,
      worldBossMaxHp: 100
    })
    const { container } = render(<WorldBossArena serverOffset={0} />)
    const model = container.querySelector('.hexurion-model')
    expect(model?.className).toContain('dying')
  })

  it('calculates the remaining encounter time correctly using serverOffset and endsAt', () => {
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(100000)
    setupMocks({
      worldBossType: 'HEXURION',
      worldBossEncounterEndsAt: 160000,
      worldBossStrikeCount: 12345
    })

    render(<WorldBossArena serverOffset={10000} />)
    expect(screen.getByText('50')).toBeInTheDocument()
    nowSpy.mockRestore()
  })

  it('triggers the wince animation and displays the correct hit result text on hit results', () => {
    const clearLastHitMock = vi.fn()
    setupMocks({
      worldBossType: 'HEXURION',
      lastBossHitResult: 'HIT',
      lastBossHitDamage: 3,
      clearLastBossHitResult: clearLastHitMock
    })

    const { container } = render(<WorldBossArena serverOffset={0} />)

    expect(mockPlayBossTakeDmg).toHaveBeenCalledWith('HEXURION')
    expect(container.querySelector('.hexurion-model')?.className).toContain(
      'wince'
    )
    expect(container.querySelector('.boss-hit-flash')).toBeInTheDocument()
    expect(screen.getByText('CRIT')).toBeInTheDocument()
    expect(clearLastHitMock).toHaveBeenCalled()
  })

  it('triggers the miss animation and blocked text on miss results', () => {
    const clearLastHitMock = vi.fn()
    setupMocks({
      worldBossType: 'HEXURION',
      lastBossHitResult: 'MISS',
      clearLastBossHitResult: clearLastHitMock
    })

    const { container } = render(<WorldBossArena serverOffset={0} />)

    expect(mockPlayBossAttack).toHaveBeenCalledWith('HEXURION')
    expect(container.querySelector('.boss-miss-flash')).toBeInTheDocument()
    expect(screen.getByText('BLOCKED')).toBeInTheDocument()
    expect(clearLastHitMock).toHaveBeenCalled()
  })

  it('creates pooled damage numbers on burst events and clears them after timeout', () => {
    vi.useFakeTimers()
    setupMocks({ worldBossType: 'HEXURION' })

    vi.mocked(drainBurstEvents).mockReturnValueOnce([
      { userId: 'u1', nickname: 'Tester1', damage: 1 },
      { userId: 'u2', nickname: 'Tester2', damage: 3 }
    ])

    render(<WorldBossArena serverOffset={0} />)

    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(screen.getByText('HIT')).toBeInTheDocument()
    expect(screen.getByText('CRIT')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1300)
    })

    expect(screen.queryByText('HIT')).not.toBeInTheDocument()
    expect(screen.queryByText('CRIT')).not.toBeInTheDocument()

    vi.useRealTimers()
  })
})