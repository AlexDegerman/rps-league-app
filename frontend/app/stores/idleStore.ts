import { create } from 'zustand'

interface IdleState {
  isEligible: boolean
  setEligible: (v: boolean) => void
  idleSide: 'left' | 'right' | null
  setIdleSide: (side: 'left' | 'right' | null) => void
  isProcessing: boolean
  setIsProcessing: (v: boolean) => void
  processedGameIds: Set<string>
  markProcessed: (gameId: string) => void
  hasInteractedWithIdle: boolean
  setHasInteractedWithIdle: (v: boolean) => void
}

export const useIdleStore = create<IdleState>((set) => ({
  isEligible: false,
  setEligible: (v) => set({ isEligible: v }),
  idleSide: null,
  setIdleSide: (side) => set({ idleSide: side }),
  isProcessing: false,
  setIsProcessing: (v) => set({ isProcessing: v }),
  processedGameIds: new Set(),
  markProcessed: (gameId) =>
    set((s) => {
      const next = new Set(s.processedGameIds)
      next.add(gameId)
      return { processedGameIds: next }
    }),
  hasInteractedWithIdle: false,
  setHasInteractedWithIdle: (v) => set({ hasInteractedWithIdle: v })
}))
