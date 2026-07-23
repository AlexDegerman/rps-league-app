import { create } from 'zustand'
import type {
  PendingMatch,
  Match,
  PredictionRecord,
  FestivalModeKey,
  VisualMode,
  EventTheme,
  AchievementNotif,
  GlobalEventType,
  GlobalEventPhase,
  PredictionResultSSEData,
  WorldBossPhase,
  WorldBossType,
  DamagerEntry,
  WorldBossSyncPayload,
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

  // Reveal State
  revealResults: Map<string, Match>
  setRevealResult: (gameId: string, result: Match) => void
  getRevealResult: (gameId: string) => Match | undefined

  // Prediction State
  predictions: Map<string, PredictionRecord>
  setPrediction: (gameId: string, record: PredictionRecord) => void
  updatePrediction: (gameId: string, update: Partial<PredictionRecord>) => void
  deletePrediction: (gameId: string) => void
  oracleSide: 'left' | 'right' | null
  setOracleSide: (side: 'left' | 'right' | null) => void
  latestPredictionResult: PredictionResultSSEData | null
  setLatestPredictionResult: (data: PredictionResultSSEData | null) => void

  // Festival State
  activeFestival: boolean
  festivalType: string | null
  festivalEndsAt: number | null
  festivalModeKey: FestivalModeKey | null
  setActiveFestival: (type: string, endsAt: number | null) => void
  clearFestival: () => void
  syncFestivalModeKey: () => void

  // Global Event State
  activeGlobalEvent: GlobalEventType | null
  globalEventPhase: GlobalEventPhase | null
  globalEventActiveAt: number | null // warning → active transition timestamp
  globalEventEndsAt: number | null
  globalEventStartedAt: number | null
  setGlobalEventWarning: (
    type: GlobalEventType,
    activeAt: number,
    endsAt: number,
    startedAt: number
  ) => void
  setGlobalEventActive: (type: GlobalEventType, endsAt: number) => void
  clearGlobalEvent: () => void

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
  flashEventJustTriggered: EventTheme
  setFlashEventJustTriggered: (t: EventTheme) => void

  // Server Time State
  serverOffset: number
  setServerOffset: (offset: number) => void
  now: number
  tickNow: () => void

  // Achievement Toast Queue
  achievementQueue: AchievementNotif[]
  pushAchievement: (a: AchievementNotif) => void
  shiftAchievement: () => void
  clearAllAchievements: () => void
  // World Boss State
  worldBossPhase: WorldBossPhase | null
  worldBossType: WorldBossType | null
  worldBossHpPct: number
  worldBossMaxHp: number
  worldBossEndsAt: number | null
  worldBossWarningActiveAt: number | null
  worldBossStrikeCount: number
  worldBossTopDamagers: DamagerEntry[]
  worldBossMyRank: number | null
  worldBossMyDamagePct: number
  worldBossEncounterEndsAt: number | null
  lastBossHitResult: 'HIT' | 'MISS' | null
  lastBossHitDamage: number
  worldBossParticipantCount: number

  setWorldBossWarning: (payload: {
    bossType: WorldBossType
    activeAt: number
    endsAt: number
  }) => void
  setWorldBossActive: (payload: {
    bossType: WorldBossType
    endsAt: number
  }) => void
  setWorldBossHp: (
    pct: number,
    maxHp?: number,
    participantCount?: number
  ) => void
  setWorldBossDamagers: (
    top: DamagerEntry[],
    myRank: number | null,
    myPct: number
  ) => void
  setWorldBossStrikeCount: (n: number) => void
  clearWorldBoss: () => void
  setWorldBossSync: (payload: WorldBossSyncPayload) => void
  setLastBossHitResult: (r: 'HIT' | 'MISS', damage?: number) => void
  clearLastBossHitResult: () => void
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

export const useGameStore = create<GameState>((set, get) => ({
  // Defaults
  backendReady: false,
  pendingMatches: [],
  matches: [],
  revealResults: new Map(),
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
  flashEventJustTriggered: null,
  achievementQueue: [],
  activeGlobalEvent: null,
  globalEventPhase: null,
  globalEventActiveAt: null,
  globalEventEndsAt: null,
  globalEventStartedAt: null,
  latestPredictionResult: null,
  worldBossPhase: null,
  worldBossType: null,
  worldBossHpPct: 100,
  worldBossMaxHp: 0,
  worldBossEndsAt: null,
  worldBossWarningActiveAt: null,
  worldBossStrikeCount: 0,
  worldBossTopDamagers: [],
  worldBossMyRank: null,
  worldBossMyDamagePct: 0,
  worldBossEncounterEndsAt: null,
  lastBossHitResult: null,
  lastBossHitDamage: 0,
  worldBossParticipantCount: 0,

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

  // Actions - Reveal State
  setRevealResult: (gameId, result) =>
    set((s) => {
      const next = new Map(s.revealResults)
      next.set(gameId, result)
      return { revealResults: next }
    }),
  getRevealResult: (gameId) => get().revealResults.get(gameId),

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
  setLatestPredictionResult: (data) => set({ latestPredictionResult: data }),

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
  setFlashEventJustTriggered: (t) => set({ flashEventJustTriggered: t }),

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

  // Actions - Global Event
  setGlobalEventWarning: (type, activeAt, endsAt, startedAt) =>
    set({
      activeGlobalEvent: type,
      globalEventPhase: 'warning',
      globalEventActiveAt: activeAt,
      globalEventEndsAt: endsAt,
      globalEventStartedAt: startedAt
    }),

  setGlobalEventActive: (type, endsAt) =>
    set({
      activeGlobalEvent: type,
      globalEventPhase: 'active',
      globalEventActiveAt: null,
      globalEventEndsAt: endsAt
    }),

  clearGlobalEvent: () =>
    set({
      activeGlobalEvent: null,
      globalEventPhase: null,
      globalEventActiveAt: null,
      globalEventEndsAt: null,
      globalEventStartedAt: null
    }),
  // Actions - World Boss
  setWorldBossWarning: ({ bossType, activeAt, endsAt }) =>
    set({
      worldBossPhase: 'WARNING',
      worldBossType: bossType,
      worldBossWarningActiveAt: activeAt,
      worldBossEndsAt: endsAt
    }),

  setWorldBossActive: ({ bossType, endsAt }) =>
    set({
      worldBossPhase: 'ACTIVE',
      worldBossType: bossType,
      worldBossWarningActiveAt: null,
      worldBossEncounterEndsAt: endsAt,
      worldBossEndsAt: endsAt
    }),

  setWorldBossHp: (pct, maxHp, participantCount) =>
    set((s) => ({
      worldBossHpPct: pct,
      worldBossMaxHp: maxHp !== undefined ? maxHp : s.worldBossMaxHp,
      worldBossParticipantCount:
        participantCount !== undefined
          ? participantCount
          : s.worldBossParticipantCount
    })),

  setWorldBossDamagers: (top, myRank, myPct) =>
    set({
      worldBossTopDamagers: top,
      worldBossMyRank: myRank,
      worldBossMyDamagePct: myPct
    }),

  setWorldBossStrikeCount: (n) => set({ worldBossStrikeCount: n }),

  clearWorldBoss: () =>
    set({
      worldBossPhase: 'COOLDOWN',
      worldBossType: null,
      worldBossHpPct: 100,
      worldBossMaxHp: 0,
      worldBossEndsAt: null,
      worldBossWarningActiveAt: null,
      worldBossStrikeCount: 0,
      worldBossTopDamagers: [],
      worldBossMyRank: null,
      worldBossMyDamagePct: 0,
      worldBossEncounterEndsAt: null,
      lastBossHitResult: null,
      lastBossHitDamage: 0,
      worldBossParticipantCount: 0
    }),

  setWorldBossSync: (payload) =>
    set({
      worldBossPhase: payload.phase,
      worldBossType: payload.bossType,
      worldBossHpPct: payload.hpPct,
      worldBossMaxHp: payload.bossMaxHp ?? 0,
      worldBossStrikeCount: payload.strikeCount,
      worldBossEncounterEndsAt: payload.encounterEndsAt,
      worldBossWarningActiveAt: payload.warningEndsAt,
      worldBossEndsAt: payload.encounterEndsAt ?? payload.warningEndsAt
    }),

  setLastBossHitResult: (r, damage) =>
    set({ lastBossHitResult: r, lastBossHitDamage: damage ?? 1 }),
  clearLastBossHitResult: () =>
    set({ lastBossHitResult: null, lastBossHitDamage: 0 }),

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

      const globalExpired =
        state.activeGlobalEvent &&
        state.globalEventEndsAt &&
        syncedNow >= state.globalEventEndsAt

      if (festivalExpired || flashExpired || globalExpired) {
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
            : {}),
          ...(globalExpired
            ? {
                activeGlobalEvent: null,
                globalEventPhase: null,
                globalEventActiveAt: null,
                globalEventEndsAt: null,
                globalEventStartedAt: null
              }
            : {})
        }
      }

      return { now: currentTime }
    }),
  // Actions - Achievement Toast
  pushAchievement: (a) =>
    set((s) => ({ achievementQueue: [...s.achievementQueue, a] })),
  shiftAchievement: () =>
    set((s) => ({ achievementQueue: s.achievementQueue.slice(1) })),
  clearAllAchievements: () => set({ achievementQueue: [] })
}))
