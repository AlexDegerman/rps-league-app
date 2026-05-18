import { create } from 'zustand'
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
    // 1. Load identity from localStorage library
    const user = getOrCreateUser()
    if (!isUserValid(user)) return

    // 2. Sync store immediately so UI links and names work instantly
    set({
      userId: user.userId,
      shortId: user.shortId,
      displayNickname: user.nickname,
      isHydrated: true
    })

    // 3. Fetch fresh stats from API (Points, Peak, WinStreak)
    const data = await fetchUserPoints(
      user.userId,
      user.shortId,
      user.nickname
    ).catch((err) => {
      console.error('Failed to fetch user points during init:', err)
      return null
    })

    if (!data) return

    // 4. Update balance and peaks
    const newPoints = BigInt(data.points)
    const newPeak = BigInt(data.peakPoints)
    get().applyPointsUpdate(newPoints, newPeak)

    // 5. Update display name if server has a different one
    if (data.nickname) set({ displayNickname: data.nickname })

    // 6. Restore win streak progress
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

    // Try to find an available random name
    while (attempts < 10 && !isAvailable) {
      newName = regenerateNickname() // Updates lib/localStorage
      attempts++
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/check-name/${newName}`
        )
        const data = await res.json()
        isAvailable = data.available
      } catch (err) {
        console.warn(`Attempt ${attempts} to check name failed:`, err)
      }
    }

    if (!isAvailable) return null

    try {
      // Sync name change to backend leaderboard
      await updateNickname(userId, newName, shortId)
      set({ displayNickname: newName })
      return newName
    } catch (err) {
      console.error('Failed to sync nickname:', err)
      return null
    }
  },

  recoverProfile: async (code: string) => {
    try {
      const data = await handleRecoverProfile(code.trim())
      if (!data) return { success: false, error: 'Invalid recovery code' }

      // 1. Update the "Disk" (localStorage)
      localStorage.setItem('rps_user_id', data.userId)
      localStorage.setItem('rps_short_id', data.shortId)
      if (data.nickname) localStorage.setItem('rps_nickname', data.nickname)

      // 2. Clear memory cache to force fresh identity read
      clearUserCache()

      // 3. Re-initialize the store with the recovered data
      await get().initUser()
      return { success: true }
    } catch (err) {
      console.error('Profile recovery failed:', err)
      return { success: false, error: 'Failed to recover profile' }
    }
  },

  resetProfile: async () => {
    try {
      // 1. Wipe local identity completely
      resetUser()
      const newUser = getOrCreateUser()

      // 2. Sync new starting identity to backend
      try {
        await updateNickname(newUser.userId, newUser.nickname, newUser.shortId)
      } catch (e) {
        console.error('Initial reset sync failed:', e)
      }

      // 3. Refresh reactive state back to starting values
      await get().initUser()
      return { success: true }
    } catch (err) {
      console.error('Profile reset failed:', err)
      return { success: false, error: 'Failed to reset profile' }
    }
  },

  // Actions - Balance Logic
  applyPointsUpdate: (newPoints, newPeak) =>
    set((s) => {
      const isNewPeak = newPeak > s.peakPoints
      // Handle bet safety: ensure bet isn't higher than new balance
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
