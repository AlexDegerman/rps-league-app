'use client'

import { useEffect } from 'react'
import { useMusicStore, type BGMContext } from '@/app/stores/musicStore'

export function resolveBGM(state: {
  neonParadiseActive: boolean
  worldBossActive: boolean
  festivalActive: boolean
  globalEventActive: boolean
  flashEventActive: boolean
}): BGMContext {
  if (state.neonParadiseActive) return 'neon-paradise'
  if (state.worldBossActive) return 'world-boss'
  if (state.festivalActive) return 'festival'
  if (state.globalEventActive) return 'global-event'
  if (state.flashEventActive) return 'flash-event'
  return 'base'
}

export interface BGMState {
  neonParadiseActive: boolean
  worldBossActive: boolean
  festivalActive: boolean
  globalEventActive: boolean
  flashEventActive: boolean
}

export function useBGM(gameState: BGMState) {
  const switchContext = useMusicStore((s) => s.switchContext)
  const startPlayback = useMusicStore((s) => s.startPlayback)

  // Unlock on first user interaction (browser autoplay policy)
  useEffect(() => {
    const unlock = () => {
      startPlayback()
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [startPlayback])

  // React to game state changes
  useEffect(() => {
    switchContext(resolveBGM(gameState))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    gameState.neonParadiseActive,
    gameState.worldBossActive,
    gameState.festivalActive,
    gameState.globalEventActive,
    gameState.flashEventActive,
    switchContext
  ])
}
