import { create } from 'zustand'
import * as Sentry from '@sentry/nextjs'
import {
  getOrCreateUser,
  isUserValid,
  regenerateNickname,
  resetUser,
  clearUserCache
} from '@/lib/user'
import {
  fetchUserPoints,
  updateNickname,
  handleRecoverProfile
} from '@/lib/api'
import { logger } from '@/lib/logger'

interface UserState {
  // Identity State
  userId: string
  shortId: string
  displayNickname: string
  isHydrated: boolean
  setDisplayNickname: (name: string) => void
  setIsHydrated: (v: boolean) => void

  // Balance & Betting State
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

  // Progression State
  winStreak: number
  streakMult: number
  dailyRank: number | null
  setWinStreak: (n: number) => void
  setStreakMult: (n: number) => void
  setDailyRank: (rank: number | null) => void

  // Core Identity Actions
  initUser: () => Promise<void>
  rerollNickname: () => Promise<string | null>
  recoverProfile: (
    code: string
  ) => Promise<{ success: boolean; error?: string }>
  resetProfile: () => Promise<{ success: boolean; error?: string }>

  // Data Logic Actions
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

  // Setters - Identity
  setDisplayNickname: (name) => set({ displayNickname: name }),
  setIsHydrated: (v) => set({ isHydrated: v }),

  // Setters - Balance & Betting
  setPoints: (p) => set({ points: p }),
  setPointsLoaded: (v) => set({ pointsLoaded: v }),
  setPeakPoints: (p) => set({ peakPoints: p }),
  setBetAmount: (b) => set({ betAmount: b }),
  setAutoAllIn: (v) => set({ autoAllIn: v }),

  // Setters - Progression
  setWinStreak: (n) => set({ winStreak: n }),
  setStreakMult: (n) => set({ streakMult: n }),
  setDailyRank: (rank) => set({ dailyRank: rank }),

  // Actions - Initialization
  initUser: async () => {
    const user = getOrCreateUser()
    if (!isUserValid(user)) return

    set({
      userId: user.userId,
      shortId: user.shortId,
      displayNickname: user.nickname,
      isHydrated: true
    })

    Sentry.setUser({
      id: user.userId,
      username: user.nickname
    })
    Sentry.setTag('shortId', user.shortId)

    const data = await fetchUserPoints(
      user.userId,
      user.shortId,
      user.nickname
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

    const newPoints = BigInt(data.points)
    const newPeak = BigInt(data.peakPoints)
    get().applyPointsUpdate(newPoints, newPeak)

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

  // Actions - Identity Management
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

  // Actions - Balance Logic
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
