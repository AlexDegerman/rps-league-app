import { create } from 'zustand'
import type { ResultAnim } from '@/types/rps'


interface UIState {
  resultAnim: ResultAnim | null
  notification: 'new_visitor' | 'no_bigint' | null
  errorMessage: string | null
  showJumpButton: boolean
  showPointsInfo: boolean
  showPointsExplainer: boolean
  isFocused: boolean
  inputString: string
  persistentError: string | null

  setPersistentError: (msg: string | null) => void
  setResultAnim: (anim: ResultAnim | null) => void
  clearResultAnim: () => void
  setNotification: (n: 'new_visitor' | 'no_bigint' | null) => void
  triggerError: (msg: string) => void
  setShowJumpButton: (v: boolean) => void
  setShowPointsInfo: (v: boolean) => void
  setShowPointsExplainer: (v: boolean) => void
  setIsFocused: (v: boolean) => void
  setInputString: (s: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  resultAnim: null,
  notification: null,
  errorMessage: null,
  persistentError: null,

  showJumpButton: false,
  showPointsInfo: false,
  showPointsExplainer: false,
  isFocused: false,
  inputString: '100000',

  setPersistentError: (msg) => set({ persistentError: msg }),

  setResultAnim: (anim) => set({ resultAnim: anim }),
  clearResultAnim: () => set({ resultAnim: null }),
  setNotification: (n) => set({ notification: n }),
  triggerError: (msg) => {
    set({ errorMessage: msg })
    setTimeout(() => set({ errorMessage: null }), 1200)
  },
  setShowJumpButton: (v) => set({ showJumpButton: v }),
  setShowPointsInfo: (v) => set({ showPointsInfo: v }),
  setShowPointsExplainer: (v) => set({ showPointsExplainer: v }),
  setIsFocused: (v) => set({ isFocused: v }),
  setInputString: (s) => set({ inputString: s })
}))
