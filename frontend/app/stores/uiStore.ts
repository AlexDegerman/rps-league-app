import { create } from 'zustand'
import type { ResultAnim } from '@/types/rps'
import { OracleTickerMessage } from '@/components/OracleMessageTicker'

type BrandTheme = 'LUNAR' | 'ELECTRIC' | 'CARDS' | 'HELLFIRE'
export type PopupKind =
  | 'flash_event'
  | 'ascension'
  | 'achievement'
  | 'relic_drop'

export interface PopupQueueItem {
  id: string
  kind: PopupKind
  priority: number
  payload?: unknown
}

const POPUP_PRIORITIES: Record<PopupKind, number> = {
  flash_event: 0,
  ascension: 1,
  relic_drop: 2,
  achievement: 3
}

interface UIState {
  showAscensionPrompt: boolean
  setShowAscensionPrompt: (v: boolean) => void
  oracleTickerMessage: OracleTickerMessage | null
  setOracleTickerMessage: (msg: OracleTickerMessage | null) => void

  // Oracle TTS
  oracleTTSEnabled: boolean
  toggleOracleTTS: () => void
  oracleVolume: number
  setOracleVolume: (v: number) => void

  // Popup queue
  popupQueue: PopupQueueItem[]
  activePopup: PopupQueueItem | null
  enqueuePopup: (item: Omit<PopupQueueItem, 'priority'>) => void
  dequeuePopup: () => void
  isTransitioning: boolean
  readyToShow: boolean

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
  ascensionDeclinedThisSession: boolean
  setAscensionDeclinedThisSession: (v: boolean) => void
  showBonusModal: boolean
  setShowBonusModal: (v: boolean) => void

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
  showBonusModal: false,
  showAscensionPrompt: false,
  oracleTickerMessage: null,
  ascensionDeclinedThisSession: false,
  popupQueue: [],
  activePopup: null,
  readyToShow: false,
  isTransitioning: false,

  oracleTTSEnabled:
    typeof window !== 'undefined'
      ? localStorage.getItem('oracleTTSEnabled') !== 'false'
      : true,

  toggleOracleTTS: () =>
    set((s) => {
      const next = !s.oracleTTSEnabled
      if (typeof window !== 'undefined') {
        localStorage.setItem('oracleTTSEnabled', String(next))
      }
      return { oracleTTSEnabled: next }
    }),
  oracleVolume:
    typeof window !== 'undefined'
      ? parseFloat(localStorage.getItem('oracleVolume') ?? '0.88')
      : 0.88,
  setOracleVolume: (v) =>
    set(() => {
      const clamped = Math.max(0, Math.min(1, v))
      if (typeof window !== 'undefined')
        localStorage.setItem('oracleVolume', String(clamped))
      return { oracleVolume: clamped }
    }),
  // Actions
  setOracleTickerMessage: (msg) => set({ oracleTickerMessage: msg }),
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
  setShowBonusModal: (v) => set({ showBonusModal: v }),
  setShowJumpButton: (v) => set({ showJumpButton: v }),
  setShowPointsInfo: (v) => set({ showPointsInfo: v }),
  setShowPointsExplainer: (v) => set({ showPointsExplainer: v }),
  setShowAscensionPrompt: (v) => set({ showAscensionPrompt: v }),
  setAscensionDeclinedThisSession: (v) =>
    set({ ascensionDeclinedThisSession: v }),
  enqueuePopup: (item) =>
    set((s) => {
      if (
        s.popupQueue.some((p) => p.id === item.id) ||
        s.activePopup?.id === item.id
      )
        return s

      const full = { ...item, priority: POPUP_PRIORITIES[item.kind] }
      const next = [...s.popupQueue, full].sort(
        (a, b) => a.priority - b.priority
      )

      return {
        activePopup: s.activePopup ?? next[0],
        popupQueue: s.activePopup ? next : next.slice(1),
        readyToShow: s.activePopup ? s.readyToShow : false
      }
    }),

  dequeuePopup: () =>
    set((s) => ({
      activePopup: s.popupQueue[0] ?? null,
      popupQueue: s.popupQueue.slice(1),
      readyToShow: false
    })),
  setIsFocused: (v) => set({ isFocused: v }),
  setInputString: (s) => set({ inputString: s })
}))
