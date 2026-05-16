import { create } from 'zustand'
import { getOrCreateUser, isUserValid } from '@/lib/user'
import { fetchUserPoints } from '@/lib/api'

interface UserState {
  points: bigint
  pointsLoaded: boolean
  betAmount: bigint
  peakPoints: bigint
  autoAllIn: boolean
  winStreak: number
  streakMult: number
  displayNickname: string
  dailyRank: number | null
  isHydrated: boolean
  
  setPoints: (p: bigint) => void
  setPointsLoaded: (v: boolean) => void
  setBetAmount: (b: bigint) => void
  setPeakPoints: (p: bigint) => void
  setAutoAllIn: (v: boolean) => void
  setWinStreak: (n: number) => void
  setStreakMult: (n: number) => void
  setDisplayNickname: (name: string) => void
  setDailyRank: (rank: number | null) => void
  setIsHydrated: (v: boolean) => void
  applyPointsUpdate: (newPoints: bigint, newPeak: bigint) => void
  initUser: () => Promise<void>
}

export const useUserStore = create<UserState>((set, get) => ({
  points: 200000n,
  pointsLoaded: false,
  betAmount: 100000n,
  peakPoints: 200000n,
  autoAllIn: true,
  winStreak: 0,
  streakMult: 1,
  displayNickname: '',
  dailyRank: null,
  isHydrated: false,

  setPoints: (p) => set({ points: p }),
  setPointsLoaded: (v) => set({ pointsLoaded: v }),
  setBetAmount: (b) => set({ betAmount: b }),
  setPeakPoints: (p) => set({ peakPoints: p }),
  setAutoAllIn: (v) => set({ autoAllIn: v }),
  setWinStreak: (n) => set({ winStreak: n }),
  setStreakMult: (n) => set({ streakMult: n }),
  setDisplayNickname: (name) => set({ displayNickname: name }),
  setDailyRank: (rank) => set({ dailyRank: rank }),
  setIsHydrated: (v) => set({ isHydrated: v }),

  // Atomic update used after fetchUpdatedPoints resolves
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
    }),

  initUser: async () => {
    const user = getOrCreateUser()
    if (!isUserValid(user)) return
    set({ displayNickname: user.nickname, isHydrated: true })

    const data = await fetchUserPoints(
      user.userId,
      user.shortId,
      user.nickname
    ).catch(() => null)
    if (!data) return

    const newPoints = BigInt(data.points)
    const newPeak = BigInt(data.peakPoints)
    get().applyPointsUpdate(newPoints, newPeak)

    if (data.nickname) set({ displayNickname: data.nickname })
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
  }
}))