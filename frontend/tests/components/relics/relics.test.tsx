import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import RelicSlot from '@/components/relics/RelicSlot'
import RelicDropPopup from '@/components/relics/RelicDropPopup'
import RelicDrawer from '@/components/relics/RelicDrawer'
import { RelicDef } from '@/types/relics'

const mockPlayRelicDrop = vi.fn()
vi.mock('@/hooks/useSound', () => ({
  useSound: () => ({
    playRelicDrop: mockPlayRelicDrop
  })
}))

const mockRelicStore = {
  activeLoadout: 'prediction' as const,
  loadouts: {
    prediction: [null, null, null],
    world_boss: [null, null, null],
    neon_paradise: [null, null, null]
  } as Record<string, (RelicDef | null)[]>,
  equippedRelics: [null, null, null] as (RelicDef | null)[],
  inventory: [] as RelicDef[],
  inventoryLoaded: true,
  drawerOpen: false,
  relicDropQueue: [] as RelicDef[],
  setDrawerOpen: vi.fn(),
  equipRelic: vi.fn(),
  unequipRelic: vi.fn(),
  fetchInventory: vi.fn(),
  shiftDropQueue: vi.fn()
}

vi.mock('@/app/stores/relicStore', () => ({
  useRelicStore: <T,>(selector: (state: typeof mockRelicStore) => T): T =>
    selector(mockRelicStore)
}))

const mockGameStore = {
  worldBossPhase: 'IDLE' as string | null
}

vi.mock('@/app/stores/gameStore', () => ({
  useGameStore: <T,>(selector: (state: typeof mockGameStore) => T): T =>
    selector(mockGameStore)
}))

interface MockPopup {
  id: string
  kind: string
}

const mockUIStore = {
  activePopup: null as MockPopup | null,
  dequeuePopup: vi.fn(),
  readyToShow: true
}

vi.mock('@/app/stores/uiStore', () => ({
  useUIStore: <T,>(selector: (state: typeof mockUIStore) => T): T =>
    selector(mockUIStore)
}))

const mockPredictionRelic: RelicDef = {
  key: 'buffer_module',
  name: 'Buffer Module',
  rarity: 'EPIC',
  icon: 'ShieldCheck',
  effect: 'Every 15 matches, next loss does not reset streak',
  threshold: 15,
  counter: 6,
  category: 'prediction'
}

const mockBossRelic: RelicDef = {
  key: 'temporal_charge',
  name: 'Temporal Charge',
  rarity: 'RARE',
  icon: 'Clock',
  effect: 'In World Boss encounters, hits deal 2 damage in first 10s',
  category: 'world_boss'
}

const mockNeonRelic: RelicDef = {
  key: 'neon_chip',
  name: 'Neon Chip',
  rarity: 'COMMON',
  icon: 'Coins',
  effect: '+25% to Neon Paradise point rewards',
  category: 'neon_paradise'
}

describe('Relic System Components', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGameStore.worldBossPhase = 'IDLE'
    mockRelicStore.activeLoadout = 'prediction'
    mockRelicStore.loadouts = {
      prediction: [null, null, null],
      world_boss: [null, null, null],
      neon_paradise: [null, null, null]
    }
    mockRelicStore.equippedRelics = [null, null, null]
    mockRelicStore.inventory = [
      mockPredictionRelic,
      mockBossRelic,
      mockNeonRelic
    ]
    mockRelicStore.drawerOpen = false
    mockRelicStore.relicDropQueue = []
    mockUIStore.activePopup = null
    mockUIStore.readyToShow = true
  })

  describe('RelicSlot', () => {
    it('renders empty slot state and triggers drawer opening on click', () => {
      render(<RelicSlot />)

      expect(screen.getByText('0/3')).toBeDefined()
      const slotButton = screen.getAllByRole('button')[0]!
      fireEvent.click(slotButton)
      expect(mockRelicStore.setDrawerOpen).toHaveBeenCalledWith(true)
    })

    it('renders equipped relic with active charge counter and updated capacity', () => {
      mockRelicStore.equippedRelics = [mockPredictionRelic, null, null]
      render(<RelicSlot relic={mockPredictionRelic} />)

      expect(screen.getByText('1/3')).toBeDefined()
      expect(screen.getByText('6/15')).toBeDefined()
    })

    it('does not trigger drawer opening when readonly is true', () => {
      render(<RelicSlot readonly={true} />)

      const slotButton = screen.getAllByRole('button')[0]!
      fireEvent.click(slotButton)
      expect(mockRelicStore.setDrawerOpen).not.toHaveBeenCalled()
    })
  })

  describe('RelicDropPopup', () => {
    it('renders discovery details and plays drop audio when a relic drops', async () => {
      mockRelicStore.relicDropQueue = [mockBossRelic]
      mockUIStore.activePopup = { id: 'test_drop', kind: 'relic_drop' }

      await act(async () => {
        render(<RelicDropPopup />)
      })

      expect(screen.getByText('Temporal Charge')).toBeDefined()
      expect(screen.getByText('RARE Tier')).toBeDefined()
      expect(mockPlayRelicDrop).toHaveBeenCalledWith('RARE')
    })

    it('auto-equips directly into first available slot on Equip Now when empty slots exist', async () => {
      mockRelicStore.relicDropQueue = [mockNeonRelic]
      mockRelicStore.loadouts.neon_paradise = [null, null, null]
      mockUIStore.activePopup = { id: 'test_drop', kind: 'relic_drop' }

      await act(async () => {
        render(<RelicDropPopup />)
      })

      const equipNowBtn = screen.getByText('Equip Now')
      await act(async () => {
        fireEvent.click(equipNowBtn)
      })

      expect(mockRelicStore.equipRelic).toHaveBeenCalledWith(
        mockNeonRelic,
        0,
        'neon_paradise'
      )
    })

    it('shows replacement selector on Equip Now when all preset slots are full', async () => {
      mockRelicStore.relicDropQueue = [mockNeonRelic]
      mockRelicStore.loadouts.neon_paradise = [
        mockNeonRelic,
        mockNeonRelic,
        mockNeonRelic
      ]
      mockUIStore.activePopup = { id: 'test_drop', kind: 'relic_drop' }

      await act(async () => {
        render(<RelicDropPopup />)
      })

      const equipNowBtn = screen.getByText('Equip Now')
      await act(async () => {
        fireEvent.click(equipNowBtn)
      })

      expect(screen.getByText(/Assign to NEON PARADISE Preset/i)).toBeDefined()
      expect(screen.getAllByText(/SLOT/i)).toHaveLength(3)
    })

    it('dismisses drop and dequeues popup on Dismiss click', async () => {
      vi.useFakeTimers()
      mockRelicStore.relicDropQueue = [mockBossRelic]
      mockUIStore.activePopup = { id: 'test_drop', kind: 'relic_drop' }

      await act(async () => {
        render(<RelicDropPopup />)
      })

      const dismissBtn = screen.getByText('Dismiss')
      await act(async () => {
        fireEvent.click(dismissBtn)
      })

      await act(async () => {
        vi.advanceTimersByTime(350)
      })
      expect(mockRelicStore.shiftDropQueue).toHaveBeenCalled()
      expect(mockUIStore.dequeuePopup).toHaveBeenCalled()
      vi.useRealTimers()
    })
  })

  describe('RelicDrawer', () => {
    it('does not render when drawerOpen is false', () => {
      mockRelicStore.drawerOpen = false
      const { container } = render(<RelicDrawer />)
      expect(container.firstChild).toBeNull()
    })

    it('renders all three preset tabs and displays active in-game indicator', () => {
      mockRelicStore.drawerOpen = true
      mockRelicStore.activeLoadout = 'prediction'

      render(<RelicDrawer />)

      expect(screen.getByText('Prediction')).toBeDefined()
      expect(screen.getByText('World Boss')).toBeDefined()
      expect(screen.getByText('Neon Paradise')).toBeDefined()
      expect(screen.getByText('Active In-Game')).toBeDefined()
    })

    it('filters catalog to display only relics belonging to the selected tab', () => {
      mockRelicStore.drawerOpen = true
      mockRelicStore.activeLoadout = 'prediction'

      render(<RelicDrawer />)

      expect(screen.getByText('Buffer Module')).toBeDefined()
      expect(screen.queryByText('Temporal Charge')).toBeNull()
      expect(screen.queryByText('Neon Chip')).toBeNull()

      fireEvent.click(screen.getByText('World Boss'))
      expect(screen.getByText('Temporal Charge')).toBeDefined()
      expect(screen.queryByText('Buffer Module')).toBeNull()
    })

    it('auto-equips unequipped relic into first empty slot on click', () => {
      mockRelicStore.drawerOpen = true
      mockRelicStore.activeLoadout = 'prediction'
      mockRelicStore.loadouts.prediction = [null, null, null]

      render(<RelicDrawer />)

      const relicCard = screen.getByText('Buffer Module')
      fireEvent.click(relicCard)

      expect(mockRelicStore.equipRelic).toHaveBeenCalledWith(
        mockPredictionRelic,
        0,
        'prediction'
      )
    })

    it('displays locked state for World Boss tab when encounter is active', () => {
      mockRelicStore.drawerOpen = true
      mockGameStore.worldBossPhase = 'ACTIVE'

      render(<RelicDrawer />)

      fireEvent.click(screen.getByText('World Boss'))
      expect(screen.getByText('🔒 Locked in Combat')).toBeDefined()
    })
  })
})
