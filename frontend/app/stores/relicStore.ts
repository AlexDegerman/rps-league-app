'use client'

import { create } from 'zustand'
import type { RelicDef } from '@/lib/relics'
import { getOrCreateUser } from '@/lib/user'
import { logger } from '@/lib/logger'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

const apiFetchInventory = async (userId: string): Promise<RelicDef[]> => {
  const res = await fetch(`${API_BASE}/api/relics?userId=${userId}`)
  return res.ok ? res.json() : []
}

const apiFetchEquippedRelics = async (
  userId: string
): Promise<(RelicDef | null)[]> => {
  const res = await fetch(`${API_BASE}/api/relics/equipped?userId=${userId}`)
  if (!res.ok) return [null, null, null]
  const data = await res.json()
  if (Array.isArray(data.relics)) {
    const arr: (RelicDef | null)[] = [null, null, null]
    data.relics.forEach((r: RelicDef | null, i: number) => {
      if (i < 3) arr[i] = r
    })
    return arr
  }
  // Legacy single-relic shape
  return [data.relic ?? null, null, null]
}

const apiEquip = async (
  userId: string,
  relicKey: string,
  slotIndex: number
) => {
  const res = await fetch(`${API_BASE}/api/relics/equip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, relicKey, slotIndex })
  })
  if (!res.ok) throw new Error('Failed to equip relic')
}

const apiUnequip = async (userId: string, slotIndex: number) => {
  const res = await fetch(`${API_BASE}/api/relics/unequip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, slotIndex })
  })
  if (!res.ok) throw new Error('Failed to unequip relic')
}

interface RelicStore {
  equippedRelics: (RelicDef | null)[]
  equippedRelic: RelicDef | null // backward compat: slot 0
  inventory: RelicDef[]
  inventoryLoaded: boolean
  drawerOpen: boolean
  relicDropQueue: RelicDef[]

  setDrawerOpen: (v: boolean) => void
  equipRelic: (relic: RelicDef, slotIndex: number) => Promise<void>
  unequipRelic: (slotIndex: number) => Promise<void>
  fetchInventory: () => Promise<void>
  initRelics: () => Promise<void>
  pushToDropQueue: (relic: RelicDef) => void
  shiftDropQueue: () => void
  updateRelicCounter: (counter: number, slotIndex?: number) => void
  setEquippedRelics: (relics: (RelicDef | null)[]) => void
}

export const useRelicStore = create<RelicStore>((set, get) => ({
  equippedRelics: [null, null, null],
  equippedRelic: null,
  inventory: [],
  inventoryLoaded: false,
  drawerOpen: false,
  relicDropQueue: [],

  setDrawerOpen: (v) => set({ drawerOpen: v }),

  setEquippedRelics: (relics) => {
    const normalized: (RelicDef | null)[] = [null, null, null]
    relics.forEach((r, i) => {
      if (i < 3) normalized[i] = r
    })
    set({ equippedRelics: normalized, equippedRelic: normalized[0] ?? null })
  },

  equipRelic: async (relic, slotIndex) => {
    const user = getOrCreateUser()
    const prev = [...get().equippedRelics]
    const next: (RelicDef | null)[] = [...prev]
    next.forEach((r, i) => {
      if (r?.key === relic.key) next[i] = null
    })
    next[slotIndex] = relic
    set({ equippedRelics: next, equippedRelic: next[0] ?? null })
    try {
      await apiEquip(user.userId, relic.key, slotIndex)
    } catch (err) {
      set({ equippedRelics: prev, equippedRelic: prev[0] ?? null })
      logger.error(
        'Failed to equip relic',
        err instanceof Error ? err : undefined
      )
    }
  },

  unequipRelic: async (slotIndex) => {
    const user = getOrCreateUser()
    const prev = [...get().equippedRelics]
    const next: (RelicDef | null)[] = [...prev]
    next[slotIndex] = null
    set({ equippedRelics: next, equippedRelic: next[0] ?? null })
    try {
      await apiUnequip(user.userId, slotIndex)
    } catch (err) {
      set({ equippedRelics: prev, equippedRelic: prev[0] ?? null })
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
        return slot ? { ...r, counter: slot.counter ?? r.counter } : r
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
      const relics = await apiFetchEquippedRelics(user.userId)
      set({ equippedRelics: relics, equippedRelic: relics[0] ?? null })
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
    const { equippedRelics } = get()
    const targetIndex =
      slotIndex !== undefined
        ? slotIndex
        : equippedRelics.findIndex((r) => r !== null)
    if (targetIndex === -1) return
    const next = [...equippedRelics]
    const target = next[targetIndex]
    if (target) {
      next[targetIndex] = { ...target, counter }
      set({ equippedRelics: next, equippedRelic: next[0] ?? null })
    }
  }
}))
