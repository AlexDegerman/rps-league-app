import { create } from 'zustand'
import { getOrCreateUser } from '@/lib/user'
import type { RelicDef } from '@/lib/relics'
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface RelicState {
  equippedRelic: RelicDef | null
  inventory: RelicDef[]
  drawerOpen: boolean
  dropQueue: RelicDef[]
  inventoryLoaded: boolean

  updateRelicCounter: (newCount: number) => void
  setEquippedRelic: (relic: RelicDef | null) => void
  setInventory: (relics: RelicDef[]) => void
  setDrawerOpen: (v: boolean) => void
  pushToDropQueue: (relic: RelicDef) => void
  popDropQueue: () => void
  setInventoryLoaded: (v: boolean) => void

  equipRelic: (relic: RelicDef) => Promise<void>
  unequipRelic: () => Promise<void>
  fetchInventory: () => Promise<void>
  fetchEquipped: (userId: string) => Promise<void>
  initRelics: () => Promise<void>
}

export const useRelicStore = create<RelicState>((set, get) => ({
  equippedRelic: null,
  inventory: [],
  drawerOpen: false,
  dropQueue: [],
  inventoryLoaded: false,

  setEquippedRelic: (relic) => set({ equippedRelic: relic }),
  setInventory: (relics) => set({ inventory: relics }),
  setDrawerOpen: (v) => set({ drawerOpen: v }),
  pushToDropQueue: (relic) =>
    set((state) => ({ dropQueue: [...state.dropQueue, relic] })),
  popDropQueue: () => set((state) => ({ dropQueue: state.dropQueue.slice(1) })),
  setInventoryLoaded: (v) => set({ inventoryLoaded: v }),
  updateRelicCounter: (newCount: number) =>
    set((state) => ({
      equippedRelic: state.equippedRelic
        ? { ...state.equippedRelic, counter: newCount }
        : null,
      inventory: state.inventory.map((r) =>
        state.equippedRelic && r.key === state.equippedRelic.key
          ? { ...r, counter: newCount }
          : r
      )
    })),
  equipRelic: async (relic) => {
    const { userId } = getOrCreateUser()
    await fetch(`${API_BASE}/api/relics/equip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, relicKey: relic.key })
    })
    set({ equippedRelic: relic })
  },

  unequipRelic: async () => {
    const { userId } = getOrCreateUser()
    const currentKey = get().equippedRelic?.key

    await fetch(`${API_BASE}/api/relics/unequip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    })

    set((state) => ({
      equippedRelic: null,
      inventory: state.inventory.map((r) =>
        r.key === currentKey ? { ...r, counter: 0 } : r
      )
    }))
  },

  fetchInventory: async () => {
    const { userId } = getOrCreateUser()
    try {
      const res = await fetch(`${API_BASE}/api/relics?userId=${userId}`)
      const data: RelicDef[] = await res.json()
      set({ inventory: data, inventoryLoaded: true })
    } catch {
      set({ inventoryLoaded: true })
    }
  },

  fetchEquipped: async (userId) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/relics/equipped?userId=${userId}`
      )
      const data = await res.json()
      set({ equippedRelic: data?.relic ?? null })
    } catch {}
  },

  initRelics: async () => {
    const { userId } = getOrCreateUser()
    await get().fetchEquipped(userId)
  }
}))
