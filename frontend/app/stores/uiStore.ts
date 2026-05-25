import { create } from 'zustand'
import type { ResultAnim } from '@/types/rps'

type BrandTheme = 'LUNAR' | 'ELECTRIC' | 'CARDS' | 'HELLFIRE'

interface UIState {
  showAscensionPrompt: boolean
  setShowAscensionPrompt: (v: boolean) => void
  // Brand State
  brandTheme: BrandTheme
  setBrandTheme: (t: BrandTheme) => void
  randomizeBrandTheme: () => void

  // Animations & Overlays
  resultAnim: ResultAnim | null
  setResultAnim: (anim: ResultAnim | null) => void
  clearResultAnim: () => void

  // Notifications & Errors
  notification: 'new_visitor' | 'no_bigint' | 'oracle' | 'idle_unlock' | null
  setNotification: (
    n: 'new_visitor' | 'no_bigint' | 'oracle' | 'idle_unlock' | null
  ) => void
  errorMessage: string | null
  triggerError: (msg: string) => void
  persistentError: string | null
  setPersistentError: (msg: string | null) => void

  // Modals & UI Flags
  showWelcomeModal: boolean
  setShowWelcomeModal: (v: boolean) => void
  showUpdateModal: boolean
  setShowUpdateModal: (v: boolean) => void
  showJumpButton: boolean
  setShowJumpButton: (v: boolean) => void
  showPointsInfo: boolean
  setShowPointsInfo: (v: boolean) => void
  showPointsExplainer: boolean
  setShowPointsExplainer: (v: boolean) => void

  // Input State
  isFocused: boolean
  setIsFocused: (v: boolean) => void
  inputString: string
  setInputString: (s: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  // Defaults
  brandTheme: 'LUNAR',
  resultAnim: null,
  notification: null,
  errorMessage: null,
  persistentError: null,
  showJumpButton: false,
  showPointsInfo: false,
  showPointsExplainer: false,
  isFocused: false,
  inputString: '100000',
  showWelcomeModal: false,
  showUpdateModal: false,
  showAscensionPrompt: false,

  // Actions
  setBrandTheme: (t) => set({ brandTheme: t }),
  randomizeBrandTheme: () => {
    const themes: BrandTheme[] = ['LUNAR', 'ELECTRIC', 'CARDS', 'HELLFIRE']
    const random = themes[Math.floor(Math.random() * themes.length)]
    set({ brandTheme: random })
  },

  setResultAnim: (anim) => set({ resultAnim: anim }),
  clearResultAnim: () => set({ resultAnim: null }),

  setNotification: (n) => set({ notification: n }),
  triggerError: (msg) => {
    set({ errorMessage: msg })
    setTimeout(() => set({ errorMessage: null }), 1200)
  },
  setPersistentError: (msg) => set({ persistentError: msg }),

  setShowWelcomeModal: (v) => set({ showWelcomeModal: v }),
  setShowUpdateModal: (v) => set({ showUpdateModal: v }),
  setShowJumpButton: (v) => set({ showJumpButton: v }),
  setShowPointsInfo: (v) => set({ showPointsInfo: v }),
  setShowPointsExplainer: (v) => set({ showPointsExplainer: v }),
  setShowAscensionPrompt: (v) => set({ showAscensionPrompt: v }),

  setIsFocused: (v) => set({ isFocused: v }),
  setInputString: (s) => set({ inputString: s })
}))
