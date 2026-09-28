import { create } from 'zustand'
import * as Sentry from '@sentry/nextjs'
import { getOrCreatePlayer, rerollPlayerName } from '@/lib/identity'
import {
  fetchUserPoints,
  updateStylePreference,
  ascendUser,
  fetchAchievementsBulkBadges,
  updateAutoEquipBadges
} from '@/lib/api'
import { logger } from '@/lib/logger'
import { BadgeData } from '@/types/leaderboard'
import { ASCENSION_THRESHOLD } from '@/constants/prediction'

interface UserState {
  // Identity
  userId: string
  shortId: string
  displayNickname: string
  isHydrated: boolean
  setDisplayNickname: (name: string) => void
  setIsHydrated: (v: boolean) => void
  linkedinUrl: string | null
  setLinkedinUrl: (url: string | null) => void
  showLinkedinBadge: boolean
  setShowLinkedinBadge: (v: boolean) => void
  myBadges: BadgeData[]
  setMyBadges: (b: BadgeData[]) => void
  refreshBadges: () => Promise<void>
  autoEquipBadges: boolean
  setAutoEquipBadges: (
    v: boolean
  ) => Promise<{ success: boolean; error?: string }>

  // Balance & Betting
  points: bigint
  pointsLoaded: boolean
  peakPoints: bigint
  betAmount: bigint
  autoAllIn: boolean
  setPoints: (p: bigint) => void
  setPointsLoaded: (v: boolean) => void
  setPeakPoints: (p: bigint) => void
  setBetAmount: (b: bigint) => void
  setAutoAllIn: (v: boolean) => void

  // Progression
  winStreak: number
  streakMult: number
  dailyRank: number | null
  setWinStreak: (n: number) => void
  setStreakMult: (n: number) => void
  setDailyRank: (rank: number | null) => void

  // Laps
  laps: number
  fastestLapBets: number | null
  setLaps: (n: number) => void
  setFastestLapBets: (n: number | null) => void
  performAscension: () => Promise<{ success: boolean; error?: string }>

  // Style
  stylePreference: string | null
  allTimePeak: bigint
  setStylePreference: (pref: string | null) => void

  // Core Actions
  initUser: () => Promise<void>
  rerollNickname: () => Promise<string | null>
  applyPointsUpdate: (newPoints: bigint, newPeak: bigint) => void
}

export const useUserStore = create<UserState>((set, get) => ({
  // Defaults
  userId: '',
  shortId: '',
  displayNickname: '',
  isHydrated: false,
  points: 200000n,
  pointsLoaded: false,
  peakPoints: 200000n,
  betAmount: 100000n,
  autoAllIn: true,
  winStreak: 0,
  streakMult: 1,
  dailyRank: null,
  laps: 0,
  fastestLapBets: null,
  stylePreference: null,
  allTimePeak: 200000n,
  linkedinUrl: null,
  showLinkedinBadge: true,
  myBadges: [],
  autoEquipBadges: true,

  // Setters - Identity
  setDisplayNickname: (name) => set({ displayNickname: name }),
  setIsHydrated: (v) => set({ isHydrated: v }),
  setLinkedinUrl: (url) => set({ linkedinUrl: url }),
  setShowLinkedinBadge: (v) => set({ showLinkedinBadge: v }),
  setMyBadges: (b) => set({ myBadges: b }),

  // Setters - Balance
  setPoints: (p) => set({ points: p }),
  setPointsLoaded: (v) => set({ pointsLoaded: v }),
  setPeakPoints: (p) => set({ peakPoints: p }),
  setBetAmount: (b) => set({ betAmount: b }),
  setAutoAllIn: (v) => set({ autoAllIn: v }),

  // Setters - Progression
  setWinStreak: (n) => set({ winStreak: n }),
  setStreakMult: (n) => set({ streakMult: n }),
  setDailyRank: (rank) => set({ dailyRank: rank }),

  // Setters - Laps
  setLaps: (n) => set({ laps: n }),
  setFastestLapBets: (n) => set({ fastestLapBets: n }),

  // Setters - Style
  setStylePreference: (pref) => {
    const { shortId } = get()
    set({ stylePreference: pref })
    if (shortId)
      updateStylePreference(shortId, pref).catch((err) =>
        logger.error(
          'Failed to persist style preference',
          err instanceof Error ? err : undefined
        )
      )
  },

  refreshBadges: async () => {
    const { shortId } = get()
    if (!shortId) return
    try {
      const res = await fetchAchievementsBulkBadges([shortId])
      if (res && res[shortId]) {
        set({ myBadges: res[shortId] })
      }
    } catch (err) {
      logger.error(
        'Failed to refresh badges in store',
        err instanceof Error ? err : undefined
      )
    }
  },

  // Actions - Init
  initUser: async () => {
    try {
      const data = await getOrCreatePlayer()

      set({
        userId: data.coreId,
        shortId: data.shortId,
        displayNickname: data.displayName,
        isHydrated: true
      })

      await get().refreshBadges()

      Sentry.setUser({ id: data.coreId, username: data.displayName })
      Sentry.setTag('shortId', data.shortId)

      const urlParams = new URLSearchParams(window.location.search)
      let utmSource =
        urlParams.get('utm_source')?.toLowerCase().trim() ?? undefined

      if (utmSource) {
        localStorage.setItem('rps_utm_source', utmSource)
        sessionStorage.setItem('utm_source', utmSource)
      } else {
        utmSource =
          sessionStorage.getItem('utm_source') ??
          localStorage.getItem('rps_utm_source') ??
          undefined
      }

      const userData = await fetchUserPoints(
        data.coreId,
        data.shortId,
        data.displayName,
        utmSource
      ).catch((err) => {
        logger.error(
          'Failed to fetch user points during init',
          err instanceof Error ? err : undefined,
          { section: 'initUser' }
        )
        return null
      })

      if (!userData) return

      if (userData.shortId && userData.shortId !== data.shortId) {
        set({ shortId: userData.shortId })
      }

      set({
        linkedinUrl: userData.linkedinUrl || null,
        showLinkedinBadge: userData.showLinkedinBadge ?? true
      })

      const newPoints = BigInt(userData.points)
      const newPeak = BigInt(userData.peakPoints)
      get().applyPointsUpdate(newPoints, newPeak)

      if (userData.allTimePeak)
        set({ allTimePeak: BigInt(userData.allTimePeak) })
      if (userData.pointStylePreference !== undefined)
        set({ stylePreference: userData.pointStylePreference })
      if (userData.laps !== undefined) set({ laps: userData.laps })
      if (userData.fastestLapBets !== undefined)
        set({ fastestLapBets: userData.fastestLapBets ?? null })
      if (userData.autoEquipBadges !== undefined)
        set({ autoEquipBadges: userData.autoEquipBadges })
      if (data.displayName) {
        set({ displayNickname: data.displayName })
        Sentry.setContext('user', { username: data.displayName })
      }

      const savedStreak = userData.currentWinStreak ?? 0
      if (savedStreak > 0) {
        set({
          winStreak: savedStreak,
          streakMult:
            savedStreak >= 5
              ? 5
              : savedStreak >= 4
                ? 3
                : savedStreak >= 3
                  ? 2
                  : 1
        })
      }
    } catch (err) {
      logger.error(
        'Failed to initialize user identity',
        err instanceof Error ? err : undefined
      )
    }
  },

  // Actions - Ascension
  performAscension: async () => {
    const { userId, shortId, peakPoints } = get()

    if (peakPoints < ASCENSION_THRESHOLD) {
      return { success: false, error: 'Ascension threshold not met' }
    }

    try {
      const data = await ascendUser(userId, shortId)
      if (!data?.success) return { success: false, error: 'Ascension failed' }

      set({
        laps: data.laps,
        fastestLapBets: data.fastestLapBets ?? null,
        points: 200000n,
        betAmount: 200000n,
        pointsLoaded: true
      })

      const { autoAllIn } = get()
      if (!autoAllIn) set({ betAmount: 100000n })

      return { success: true }
    } catch (err) {
      logger.error(
        'performAscension failed',
        err instanceof Error ? err : undefined
      )
      return { success: false, error: 'Ascension failed' }
    }
  },

  // Actions - Identity
  rerollNickname: async () => {
    try {
      const data = await rerollPlayerName()
      if (data.success && data.nickname) {
        set({ displayNickname: data.nickname })
        Sentry.setContext('user', { username: data.nickname })
        return data.nickname
      }
      return null
    } catch (err) {
      logger.error(
        'Failed to reroll nickname',
        err instanceof Error ? err : undefined
      )
      return null
    }
  },

  setAutoEquipBadges: async (
    v
  ): Promise<{ success: boolean; error?: string }> => {
    const { shortId } = get()
    set({ autoEquipBadges: v })
    if (shortId) {
      try {
        const res = await updateAutoEquipBadges(shortId, v)
        if (res?.success) {
          if (v) {
            await get().refreshBadges()
          }
          return { success: true }
        }
        return { success: false, error: 'API update failed' }
      } catch (err) {
        logger.error(
          'Failed to persist auto equip badges preference',
          err instanceof Error ? err : undefined
        )
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        }
      }
    }
    return { success: false, error: 'No shortId found' }
  },

  applyPointsUpdate: (newPoints, newPeak) =>
    set((s) => {
      const isNewPeak = newPeak > s.peakPoints
      const newBet = s.autoAllIn
        ? newPoints
        : s.betAmount > newPoints
          ? newPoints
          : s.betAmount
      return {
        points: newPoints,
        peakPoints: isNewPeak ? newPeak : s.peakPoints,
        betAmount: newBet,
        pointsLoaded: true
      }
    })
}))
