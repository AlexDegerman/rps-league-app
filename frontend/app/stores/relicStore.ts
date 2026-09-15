import { create } from 'zustand'
import { getOrCreateUser } from '@/lib/user'
import { logger } from '@/lib/logger'
import { RelicDef, LoadoutType } from '@/types/relics'
import { getRelicCategory } from '@/constants/relics'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

const apiFetchInventory = async (userId: string): Promise<RelicDef[]> => {
  const res = await fetch(`${API_BASE}/api/relics?userId=${userId}`)
  return res.ok ? res.json() : []
}

const apiEquip = async (
  userId: string,
  relicKey: string,
  slotIndex: number,
  loadout: LoadoutType
) => {
  const res = await fetch(`${API_BASE}/api/relics/equip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, relicKey, slotIndex, loadout })
  })
  if (!res.ok) throw new Error('Failed to equip relic')
}

const apiUnequip = async (
  userId: string,
  slotIndex: number,
  loadout: LoadoutType
) => {
  const res = await fetch(`${API_BASE}/api/relics/unequip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, slotIndex, loadout })
  })
  if (!res.ok) throw new Error('Failed to unequip relic')
}

interface RelicStore {
  activeLoadout: LoadoutType
  loadouts: Record<LoadoutType, (RelicDef | null)[]>
  equippedRelics: (RelicDef | null)[]
  equippedRelic: RelicDef | null // backward compat: slot 0
  inventory: RelicDef[]
  inventoryLoaded: boolean
  drawerOpen: boolean
  relicDropQueue: RelicDef[]

  setActiveLoadout: (loadout: LoadoutType) => void
  setDrawerOpen: (v: boolean) => void
  equipRelic: (
    relic: RelicDef,
    slotIndex: number,
    loadout?: LoadoutType
  ) => Promise<void>
  unequipRelic: (slotIndex: number, loadout?: LoadoutType) => Promise<void>
  fetchInventory: () => Promise<void>
  initRelics: () => Promise<void>
  pushToDropQueue: (relic: RelicDef) => void
  shiftDropQueue: () => void
  updateRelicCounter: (counter: number, slotIndex?: number) => void
  setEquippedRelics: (
    relics: (RelicDef | null)[],
    loadout?: LoadoutType
  ) => void
}

export const useRelicStore = create<RelicStore>((set, get) => ({
  activeLoadout: 'prediction',
  loadouts: {
    prediction: [null, null, null],
    world_boss: [null, null, null],
    neon_paradise: [null, null, null]
  },
  equippedRelics: [null, null, null],
  equippedRelic: null,
  inventory: [],
  inventoryLoaded: false,
  drawerOpen: false,
  relicDropQueue: [],

  setActiveLoadout: (loadout) => {
    const current = get().loadouts[loadout] ?? [null, null, null]
    set({
      activeLoadout: loadout,
      equippedRelics: current,
      equippedRelic: current[0] ?? null
    })
  },

  setDrawerOpen: (v) => set({ drawerOpen: v }),

  setEquippedRelics: (relics, loadout) => {
    const target = loadout ?? get().activeLoadout
    const normalized: (RelicDef | null)[] = [null, null, null]
    relics.forEach((r, i) => {
      if (i < 3) normalized[i] = r
    })
    const updatedLoadouts = {
      ...get().loadouts,
      [target]: normalized
    }
    set({
      loadouts: updatedLoadouts,
      ...(target === get().activeLoadout
        ? { equippedRelics: normalized, equippedRelic: normalized[0] ?? null }
        : {})
    })
  },

  equipRelic: async (relic, slotIndex, targetLoadout) => {
    const user = getOrCreateUser()
    const currentActive = get().activeLoadout
    const loadout =
      targetLoadout ?? relic.category ?? getRelicCategory(relic.key)
    const prevLoadout = [...(get().loadouts[loadout] ?? [null, null, null])]
    const nextLoadout: (RelicDef | null)[] = [...prevLoadout]
    nextLoadout.forEach((r, i) => {
      if (r?.key === relic.key) nextLoadout[i] = null
    })
    nextLoadout[slotIndex] = relic

    const nextLoadouts = {
      ...get().loadouts,
      [loadout]: nextLoadout
    }

    set({
      loadouts: nextLoadouts,
      ...(loadout === currentActive
        ? {
            equippedRelics: nextLoadout,
            equippedRelic: nextLoadout[0] ?? null
          }
        : {})
    })

    try {
      await apiEquip(user.userId, relic.key, slotIndex, loadout)
    } catch (err) {
      const rollbackLoadouts = {
        ...get().loadouts,
        [loadout]: prevLoadout
      }
      set({
        loadouts: rollbackLoadouts,
        ...(loadout === currentActive
          ? {
              equippedRelics: prevLoadout,
              equippedRelic: prevLoadout[0] ?? null
            }
          : {})
      })
      logger.error(
        'Failed to equip relic',
        err instanceof Error ? err : undefined
      )
    }
  },

  unequipRelic: async (slotIndex, targetLoadout) => {
    const user = getOrCreateUser()
    const currentActive = get().activeLoadout
    const loadout = targetLoadout ?? currentActive
    const prevLoadout = [...(get().loadouts[loadout] ?? [null, null, null])]
    const nextLoadout: (RelicDef | null)[] = [...prevLoadout]
    nextLoadout[slotIndex] = null

    const nextLoadouts = {
      ...get().loadouts,
      [loadout]: nextLoadout
    }

    set({
      loadouts: nextLoadouts,
      ...(loadout === currentActive
        ? {
            equippedRelics: nextLoadout,
            equippedRelic: nextLoadout[0] ?? null
          }
        : {})
    })

    try {
      await apiUnequip(user.userId, slotIndex, loadout)
    } catch (err) {
      const rollbackLoadouts = {
        ...get().loadouts,
        [loadout]: prevLoadout
      }
      set({
        loadouts: rollbackLoadouts,
        ...(loadout === currentActive
          ? {
              equippedRelics: prevLoadout,
              equippedRelic: prevLoadout[0] ?? null
            }
          : {})
      })
      logger.error(
        'Failed to unequip relic',
        err instanceof Error ? err : undefined
      )
    }
  },

  fetchInventory: async () => {
    const user = getOrCreateUser()
    try {
      const relics = await apiFetchInventory(user.userId)
      const { equippedRelics } = get()
      const merged = relics.map((r) => {
        const slot = equippedRelics.find((e) => e?.key === r.key)
        return {
          ...r,
          category: r.category ?? getRelicCategory(r.key),
          counter: slot?.counter ?? r.counter
        }
      })
      set({ inventory: merged, inventoryLoaded: true })
    } catch (err) {
      logger.error(
        'Failed to fetch relic inventory',
        err instanceof Error ? err : undefined
      )
      set({ inventoryLoaded: true })
    }
  },

  initRelics: async () => {
    const user = getOrCreateUser()
    try {
      const res = await fetch(
        `${API_BASE}/api/relics/equipped?userId=${user.userId}`
      )
      if (!res.ok) return
      const data = await res.json()
      const rawLoadouts: Record<LoadoutType, (RelicDef | null)[]> =
        data.loadouts ?? {
          prediction: Array.isArray(data.relics)
            ? data.relics
            : [null, null, null],
          world_boss: [null, null, null],
          neon_paradise: [null, null, null]
        }
      const normalize = (arr: (RelicDef | null)[] | undefined) => {
        const out: (RelicDef | null)[] = [null, null, null]
        if (Array.isArray(arr)) {
          arr.forEach((r, i) => {
            if (i < 3) out[i] = r
          })
        }
        return out
      }
      const loadouts = {
        prediction: normalize(rawLoadouts.prediction),
        world_boss: normalize(rawLoadouts.world_boss),
        neon_paradise: normalize(rawLoadouts.neon_paradise)
      }
      const currentActive = get().activeLoadout
      const currentEquipped = loadouts[currentActive]
      set({
        loadouts,
        equippedRelics: currentEquipped,
        equippedRelic: currentEquipped[0] ?? null
      })
      await get().fetchInventory()
    } catch (err) {
      logger.error(
        'Failed to init relics',
        err instanceof Error ? err : undefined
      )
    }
  },

  pushToDropQueue: (relic) =>
    set((s) => ({ relicDropQueue: [...s.relicDropQueue, relic] })),
  shiftDropQueue: () =>
    set((s) => ({ relicDropQueue: s.relicDropQueue.slice(1) })),

  updateRelicCounter: (counter, slotIndex) => {
    const { equippedRelics, activeLoadout, loadouts } = get()
    const targetIndex =
      slotIndex !== undefined
        ? slotIndex
        : equippedRelics.findIndex((r) => r !== null)
    if (targetIndex === -1) return
    const next = [...equippedRelics]
    const target = next[targetIndex]
    if (target) {
      next[targetIndex] = { ...target, counter }
      set({
        equippedRelics: next,
        equippedRelic: next[0] ?? null,
        loadouts: {
          ...loadouts,
          [activeLoadout]: next
        }
      })
    }
  }
}))
