'use client'

import { useGameStore } from '@/app/stores/gameStore'

const EDGE_CONFIG: Record<string, { radial: string; shadow: string }> = {
  flash_lunar: {
    radial: 'rgba(144,205,244,0.2)',
    shadow: 'rgba(144,205,244,0.35)'
  },
  flash_electric: {
    radial: 'rgba(159,122,234,0.25)',
    shadow: 'rgba(159,122,234,0.4)'
  },
  flash_cards: {
    radial: 'rgba(236,201,75,0.18)',
    shadow: 'rgba(236,201,75,0.3)'
  },
  flash_hellfire: {
    radial: 'rgba(197,48,48,0.3)',
    shadow: 'rgba(197,48,48,0.4)'
  },

  festival_ghost: {
    radial: 'rgba(77,208,196,0.15)',
    shadow: 'rgba(77,208,196,0.25)'
  },
  festival_safeguard: {
    radial: 'rgba(100,116,139,0.15)',
    shadow: 'rgba(100,116,139,0.25)'
  },
  festival_resonance: {
    radial: 'rgba(236,201,75,0.15)',
    shadow: 'rgba(236,201,75,0.25)'
  },
  festival_surge: {
    radial: 'rgba(34,211,238,0.2)',
    shadow: 'rgba(34,211,238,0.3)'
  },
  festival_vault: {
    radial: 'rgba(59,91,219,0.15)',
    shadow: 'rgba(59,91,219,0.25)'
  },
  festival_spark: {
    radial: 'rgba(168,85,247,0.2)',
    shadow: 'rgba(168,85,247,0.3)'
  },
  festival_sanguine: {
    radial: 'rgba(153,27,27,0.2)',
    shadow: 'rgba(153,27,27,0.35)'
  },
  festival_fever: {
    radial: 'rgba(249,115,22,0.25)',
    shadow: 'rgba(249,115,22,0.35)'
  },

  winstreak_inferno: {
    radial: 'rgba(249,115,22,0.25)',
    shadow: 'rgba(239,68,68,0.35)'
  },
  winstreak_fever: {
    radial: 'rgba(34,197,94,0.15)',
    shadow: 'rgba(34,197,94,0.2)'
  }
}


interface EdgeGlowProps {
  visualMode: string | null
}

export default function EdgeGlow({ visualMode }: EdgeGlowProps) {
  const festivalModeKey = useGameStore((s) => s.festivalModeKey)

  const isFlash = visualMode?.startsWith('flash_')
  const key = isFlash ? visualMode : (festivalModeKey ?? visualMode)

  if (!key) return null
  const e = EDGE_CONFIG[key]

  if (!e) return null

  return (
    <div
      className="fixed inset-0 pointer-events-none z-30 transition-all duration-1000"
      style={{
        background: `radial-gradient(ellipse at center, transparent 55%, ${e.radial} 100%)`,
        boxShadow: `inset 0 0 90px ${e.shadow}`
      }}
    />
  )
}
