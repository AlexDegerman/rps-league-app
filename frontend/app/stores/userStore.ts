import { create } from 'zustand'
import * as Sentry from '@sentry/nextjs'
import {
  getOrCreateUser,
  isUserValid,
  regenerateNickname,
  resetUser,
  clearUserCache,
  storeRecoveryCode
} from '@/lib/user'
import {
  fetchUserPoints,
  updateNickname,
  handleRecoverProfile,
  updateStylePreference,
  ascendUser,
  fetchAchievementsBulkBadges
} from '@/lib/api'
import { logger } from '@/lib/logger'
import { ASCENSION_THRESHOLD } from '@/lib/constants'
import { BadgeData } from '@/types/rps'

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
  recoverProfile: (
    code: string
  ) => Promise<{ success: boolean; error?: string }>
  resetProfile: () => Promise<{ success: boolean; error?: string }>
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
    const user = getOrCreateUser()
    if (!isUserValid(user)) return

    set({
      userId: user.userId,
      shortId: user.shortId,
      displayNickname: user.nickname,
      isHydrated: true
    })

    await get().refreshBadges()

    Sentry.setUser({ id: user.userId, username: user.nickname })
    Sentry.setTag('shortId', user.shortId)

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

    const data = await fetchUserPoints(
      user.userId,
      user.shortId,
      user.nickname,
      utmSource
    ).catch((err) => {
      logger.error(
        'Failed to fetch user points during init',
        err instanceof Error ? err : undefined,
        {
          section: 'initUser'
        }
      )
      return null
    })

    if (!data) return

    if (data.recoveryCode) {
      storeRecoveryCode(data.recoveryCode)
    }

    set({
      linkedinUrl: data.linkedinUrl || null,
      showLinkedinBadge: data.showLinkedinBadge ?? true
    })

    const newPoints = BigInt(data.points)
    const newPeak = BigInt(data.peakPoints)
    get().applyPointsUpdate(newPoints, newPeak)

    if (data.allTimePeak) set({ allTimePeak: BigInt(data.allTimePeak) })
    if (data.pointStylePreference !== undefined)
      set({ stylePreference: data.pointStylePreference })
    if (data.laps !== undefined) set({ laps: data.laps })
    if (data.fastestLapBets !== undefined)
      set({ fastestLapBets: data.fastestLapBets ?? null })

    if (data.nickname) {
      set({ displayNickname: data.nickname })
      Sentry.setContext('user', { username: data.nickname })
    }

    const savedStreak = data.currentWinStreak ?? 0
    if (savedStreak > 0) {
      set({
        winStreak: savedStreak,
        streakMult:
          savedStreak >= 5
            ? 10
            : savedStreak >= 4
              ? 6
              : savedStreak >= 3
                ? 3
                : 1
      })
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
    const { userId, shortId } = get()
    let newName = ''
    let attempts = 0
    let isAvailable = false

    while (attempts < 10 && !isAvailable) {
      newName = regenerateNickname()
      attempts++
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/check-name/${newName}`
        )
        const data = await res.json()
        isAvailable = data.available
      } catch (err) {
        logger.warn(`Name check attempt ${attempts} failed`, {
          error: String(err)
        })
      }
    }

    if (!isAvailable) return null

    try {
      await updateNickname(userId, newName, shortId)
      set({ displayNickname: newName })
      Sentry.setContext('user', { username: newName })
      return newName
    } catch (err) {
      logger.error(
        'Failed to sync nickname',
        err instanceof Error ? err : undefined
      )
      return null
    }
  },

  recoverProfile: async (code: string) => {
    try {
      const data = await handleRecoverProfile(code.trim())
      if (!data) return { success: false, error: 'Invalid recovery code' }

      localStorage.setItem('rps_user_id', data.userId)
      localStorage.setItem('rps_short_id', data.shortId)
      if (data.nickname) localStorage.setItem('rps_nickname', data.nickname)

      clearUserCache()
      await get().initUser()
      return { success: true }
    } catch (err) {
      logger.error(
        'Profile recovery failed',
        err instanceof Error ? err : undefined
      )
      return { success: false, error: 'Failed to recover profile' }
    }
  },

  resetProfile: async () => {
    try {
      resetUser()
      const newUser = getOrCreateUser()
      try {
        await updateNickname(newUser.userId, newUser.nickname, newUser.shortId)
      } catch (e) {
        logger.warn('Initial reset sync failed', { error: String(e) })
      }
      await get().initUser()
      return { success: true }
    } catch (err) {
      logger.error(
        'Profile reset failed',
        err instanceof Error ? err : undefined
      )
      return { success: false, error: 'Failed to reset profile' }
    }
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
