import { create } from 'zustand'
import type { PendingMatch, Match, PredictionRecord } from '@/types/rps'

interface GameState {
  // Connection State
  backendReady: boolean
  setBackendReady: (v: boolean) => void
  markReady: () => void

  // Feed State
  pendingMatches: PendingMatch[]
  setPendingMatches: (fn: (prev: PendingMatch[]) => PendingMatch[]) => void
  addPendingMatch: (match: PendingMatch) => void
  removePendingMatch: (gameId: string) => void
  matches: Match[]
  setMatches: (fn: (prev: Match[]) => Match[]) => void
  addMatch: (match: Match) => void

  // Prediction State
  predictions: Map<string, PredictionRecord>
  setPrediction: (gameId: string, record: PredictionRecord) => void
  updatePrediction: (gameId: string, update: Partial<PredictionRecord>) => void
  deletePrediction: (gameId: string) => void
  oracleSide: 'left' | 'right' | null
  setOracleSide: (side: 'left' | 'right' | null) => void

  // Event & Visual State
  activeFlashEvent: string | null
  setActiveFlashEvent: (type: string | null) => void
  flashBuffRemaining: number
  setFlashBuffRemaining: (n: number) => void
  decrementFlashBuff: () => void
  visualMode:
    | 'flash_lunar'
    | 'flash_electric'
    | 'flash_cards'
    | 'flash_hellfire'
    | 'inferno'
    | 'fever'
    | null
  setVisualMode: (m: GameState['visualMode']) => void
  liveTheme: 'LUNAR' | 'ELECTRIC' | 'CARDS' | 'HELLFIRE' | null
  setLiveTheme: (t: GameState['liveTheme']) => void

  // Server Time State
  serverOffset: number
  setServerOffset: (offset: number) => void
  now: number
  tickNow: () => void
}

export const useGameStore = create<GameState>((set) => ({
  // Defaults
  backendReady: false,
  pendingMatches: [],
  matches: [],
  predictions: new Map(),
  activeFlashEvent: null,
  flashBuffRemaining: 0,
  serverOffset: 0,
  now: Date.now(),
  visualMode: null,
  liveTheme: null,
  oracleSide: null,

  // Actions - Connection
  setBackendReady: (v) => set({ backendReady: v }),
  markReady: () => set({ backendReady: true }),

  // Actions - Feed
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

  // Actions - Predictions
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
  setOracleSide: (side) => set({ oracleSide: side }),

  // Actions - Event & Visuals
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
  setVisualMode: (m) => set({ visualMode: m }),
  setLiveTheme: (t) => set({ liveTheme: t }),

  // Actions - Server Time
  setServerOffset: (offset) => set({ serverOffset: offset }),
  tickNow: () => set({ now: Date.now() })
}))
