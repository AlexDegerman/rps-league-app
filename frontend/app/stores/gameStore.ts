import { create } from 'zustand'
import type { PendingMatch, Match, PredictionRecord } from '@/types/rps'

interface GameState {
  backendReady: boolean
  pendingMatches: PendingMatch[]
  matches: Match[]
  predictions: Map<string, PredictionRecord>
  activeFlashEvent: string | null
  flashBuffRemaining: number
  serverOffset: number
  now: number

  setBackendReady: (v: boolean) => void
  markReady: () => void
  setPendingMatches: (fn: (prev: PendingMatch[]) => PendingMatch[]) => void
  addPendingMatch: (match: PendingMatch) => void
  removePendingMatch: (gameId: string) => void
  setMatches: (fn: (prev: Match[]) => Match[]) => void
  addMatch: (match: Match) => void
  setPrediction: (gameId: string, record: PredictionRecord) => void
  updatePrediction: (gameId: string, update: Partial<PredictionRecord>) => void
  deletePrediction: (gameId: string) => void
  setActiveFlashEvent: (type: string | null) => void
  setFlashBuffRemaining: (n: number) => void
  decrementFlashBuff: () => void
  setServerOffset: (offset: number) => void
  tickNow: () => void
}

export const useGameStore = create<GameState>((set) => ({
  backendReady: false,
  pendingMatches: [],
  matches: [],
  predictions: new Map(),
  activeFlashEvent: null,
  flashBuffRemaining: 0,
  serverOffset: 0,
  now: Date.now(),

  setBackendReady: (v) => set({ backendReady: v }),
  markReady: () => set({ backendReady: true }),

  setPendingMatches: (fn) =>
    set((s) => ({ pendingMatches: fn(s.pendingMatches) })),
  addPendingMatch: (match) =>
    set((s) => {
      if (s.pendingMatches.find((p) => p.gameId === match.gameId)) return s
      return { pendingMatches: [match, ...s.pendingMatches] }
    }),
  removePendingMatch: (gameId) =>
    set((s) => ({
      pendingMatches: s.pendingMatches.filter((p) => p.gameId !== gameId)
    })),

  setMatches: (fn) => set((s) => ({ matches: fn(s.matches) })),
  addMatch: (match) =>
    set((s) => {
      if (s.matches.some((m) => m.gameId === match.gameId)) return s
      return { matches: [match, ...s.matches].slice(0, 20) }
    }),

  setPrediction: (gameId, record) =>
    set((s) => {
      const next = new Map(s.predictions)
      next.set(gameId, record)
      return { predictions: next }
    }),
  updatePrediction: (gameId, update) =>
    set((s) => {
      const next = new Map(s.predictions)
      const existing = next.get(gameId)
      if (existing) next.set(gameId, { ...existing, ...update })
      return { predictions: next }
    }),
  deletePrediction: (gameId) =>
    set((s) => {
      const next = new Map(s.predictions)
      next.delete(gameId)
      return { predictions: next }
    }),

  setActiveFlashEvent: (type) => set({ activeFlashEvent: type }),
  setFlashBuffRemaining: (n) => set({ flashBuffRemaining: n }),
  decrementFlashBuff: () =>
    set((s) => {
      const next = s.flashBuffRemaining - 1
      return {
        flashBuffRemaining: next,
        activeFlashEvent: next <= 0 ? null : s.activeFlashEvent
      }
    }),

  setServerOffset: (offset) => set({ serverOffset: offset }),
  tickNow: () => set({ now: Date.now() })
}))
