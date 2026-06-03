'use client'

import { useEffect } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import { RARITY_AURA, RARITY_TEXT, RARITY_TOAST_BG } from '@/lib/achievements'
import { AchievementRarity } from '@/types/rps'

export default function AchievementToast() {
  const achievementQueue = useGameStore((s) => s.achievementQueue)
  const shiftAchievement = useGameStore((s) => s.shiftAchievement)

  const current = achievementQueue[0] ?? null

  useEffect(() => {
    if (!current) return
    const timer = setTimeout(() => shiftAchievement(), 4000)
    return () => clearTimeout(timer)
  }, [current, shiftAchievement])

  if (!current) return null

  const rarity = current.rarity as AchievementRarity

  return (
    <div
      className={`
        fixed top-24 left-1/2 -translate-x-1/2 z-100
        flex items-center gap-3
        px-5 py-3 rounded-2xl border shadow-2xl
        animate-in fade-in slide-in-from-top-4 duration-500
        min-w-70 max-w-[90vw]
        pointer-events-none
        overflow-hidden
        ${RARITY_TOAST_BG[rarity]}
        ${RARITY_AURA[rarity]}
      `}
    >
      <div className="absolute inset-0 sheen-effect opacity-20" />

      <span className="text-3xl leading-none shrink-0 relative z-10">
        {current.icon}
      </span>

      <div className="flex flex-col min-w-0 relative z-10">
        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-black/40 leading-none mb-1">
          Achievement Unlocked
        </span>
        <span
          className={`text-[14px] font-black leading-tight truncate ${RARITY_TEXT[rarity]}`}
        >
          {current.name}
        </span>
        <span className="text-[9px] font-bold text-black/30 uppercase tracking-widest mt-1">
          Badge: {current.code}
        </span>
      </div>

      <div className="absolute bottom-0 left-0 h-1 bg-black/5 w-full">
        <div
          className="h-full bg-black/10 animate-out fade-out fill-mode-forwards"
          style={{
            animation: 'shrink-width 4s linear forwards',
            width: '100%'
          }}
        />
      </div>
    </div>
  )
}
