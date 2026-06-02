import { create } from 'zustand'
import type {
  PendingMatch,
  Match,
  PredictionRecord,
  FestivalModeKey,
  VisualMode,
  EventTheme
} from '@/types/rps'

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

  // Festival State
  activeFestival: boolean
  festivalType: string | null
  festivalEndsAt: number | null
  festivalModeKey: FestivalModeKey | null
  setActiveFestival: (type: string, endsAt: number | null) => void
  clearFestival: () => void
  syncFestivalModeKey: () => void

  // Event & Visual State
  activeFlashEvent: string | null
  setActiveFlashEvent: (type: string | null) => void
  flashBuffRemaining: number
  setFlashBuffRemaining: (n: number) => void
  decrementFlashBuff: () => void
  visualMode: VisualMode
  setVisualMode: (m: VisualMode) => void
  liveTheme: EventTheme
  setLiveTheme: (t: EventTheme) => void
  flashExpiresAt: number | null
  setFlashExpiresAt: (time: number | null) => void

  // Server Time State
  serverOffset: number
  setServerOffset: (offset: number) => void
  now: number
  tickNow: () => void
}

// Helper for consistent mapping
const FESTIVAL_MAP: Record<string, FestivalModeKey> = {
  SPARK: 'festival_spark',
  GHOST: 'festival_ghost',
  SAFEGUARD: 'festival_safeguard',
  RESONANCE: 'festival_resonance',
  SURGE: 'festival_surge',
  VAULT: 'festival_vault',
  FEVER: 'festival_fever',
  SANGUINE: 'festival_sanguine'
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
  activeFestival: false,
  festivalType: null,
  festivalEndsAt: null,
  festivalModeKey: null,
  flashExpiresAt: null,

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
  setActiveFlashEvent: (type) =>
    set({ activeFlashEvent: type, festivalModeKey: null }),
  setFlashBuffRemaining: (n) => set({ flashBuffRemaining: n }),
  decrementFlashBuff: () =>
    set((s) => {
      const next = s.flashBuffRemaining - 1
      const flashEnding = next <= 0
      return {
        flashBuffRemaining: next,
        activeFlashEvent: flashEnding ? null : s.activeFlashEvent,
        festivalModeKey:
          flashEnding && s.festivalType
            ? (FESTIVAL_MAP[s.festivalType] ?? null)
            : null
      }
    }),
  setVisualMode: (m) => set({ visualMode: m }),
  setLiveTheme: (t) => set({ liveTheme: t }),
  setFlashExpiresAt: (time) => set({ flashExpiresAt: time }),

  // Actions - Festival
  syncFestivalModeKey: () =>
    set((s) => {
      if (s.activeFlashEvent) return { festivalModeKey: null }
      if (!s.festivalType) return { festivalModeKey: null }
      return { festivalModeKey: FESTIVAL_MAP[s.festivalType] ?? null }
    }),
  setActiveFestival: (type, endsAt) => {
    set({
      activeFestival: true,
      festivalType: type,
      festivalEndsAt: endsAt
    })

    set((s) => {
      if (s.activeFlashEvent) return { festivalModeKey: null }
      return { festivalModeKey: FESTIVAL_MAP[type] ?? null }
    })
  },
  clearFestival: () =>
    set({
      activeFestival: false,
      festivalType: null,
      festivalEndsAt: null,
      festivalModeKey: null
    }),

  // Actions - Server Time
  setServerOffset: (offset) => set({ serverOffset: offset }),
  tickNow: () =>
    set((state) => {
      const currentTime = Date.now()
      const syncedNow = currentTime + state.serverOffset

      const festivalExpired =
        state.activeFestival &&
        state.festivalEndsAt &&
        syncedNow >= state.festivalEndsAt

      const flashExpired =
        state.activeFlashEvent &&
        state.flashExpiresAt &&
        syncedNow >= state.flashExpiresAt

      if (festivalExpired || flashExpired) {
        return {
          now: currentTime,
          ...(festivalExpired
            ? {
                activeFestival: false,
                festivalType: null,
                festivalEndsAt: null,
                festivalModeKey: null
              }
            : {}),
          ...(flashExpired
            ? {
                activeFlashEvent: null,
                flashExpiresAt: null,
                flashBuffRemaining: 0,
                liveTheme: null
              }
            : {})
        }
      }

      return { now: currentTime }
    })
}))
