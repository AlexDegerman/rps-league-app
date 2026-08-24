'use client'

import { useContext, createContext } from 'react'

// Shared sound API for Neon Paradise stages.
export interface NeonSoundAPI {
  playNeonClick: () => void
  playNeonReward: (multiplier: number) => void
  playNeonShimmer: () => void
  playNeonComplete: (isMaxPayout: boolean) => void
  playLayer: (key: string) => void
  playLoss: () => void
  playCards: () => void
  playElectric: () => void
  playChain: (keys: string[]) => void
}

export const NeonSoundContext = createContext<NeonSoundAPI | null>(null)

export function useNeonSound(): NeonSoundAPI {
  const ctx = useContext(NeonSoundContext)
  // No-op fallback when the sound context is unavailable.
  if (!ctx) {
    const noop = () => {}
    return {
      playNeonClick: noop,
      playNeonReward: noop,
      playNeonShimmer: noop,
      playNeonComplete: noop,
      playLayer: noop,
      playLoss: noop,
      playCards: noop,
      playElectric: noop,
      playChain: noop
    }
  }
  return ctx
}
