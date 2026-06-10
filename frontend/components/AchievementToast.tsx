'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { RARITY_AURA, RARITY_TEXT, RARITY_TOAST_BG } from '@/lib/achievements'
import { AchievementRarity } from '@/types/rps'
import { useEffect } from 'react'

export default function AchievementToast() {
  const { achievementQueue, shiftAchievement } = useGameStore()

  useEffect(() => {
    if (achievementQueue.length === 0) return
    const timer = setTimeout(() => shiftAchievement(), 2000)
    return () => clearTimeout(timer)
  }, [achievementQueue.length, shiftAchievement])

  if (achievementQueue.length === 0) return null

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-100 flex flex-col gap-2 items-center pointer-events-none">
      {achievementQueue.map((achievement, index) => {
        const rarity = achievement.rarity as AchievementRarity
        return (
          <div
            key={`${achievement.code}-${index}`}
            className={`
              flex items-center gap-3 px-5 py-3 rounded-2xl border shadow-2xl
              min-w-70 max-w-[90vw] overflow-hidden relative
              animate-in fade-in slide-in-from-top-4 duration-500
              ${RARITY_TOAST_BG[rarity]} ${RARITY_AURA[rarity]}
            `}
          >
            <span className="text-3xl shrink-0 relative z-10">
              {achievement.icon}
            </span>
            <div className="flex flex-col min-w-0 relative z-10">
              <span className="text-[10px] font-black uppercase tracking-widest text-black/40">
                Achievement
              </span>
              <span
                className={`text-[14px] font-black leading-tight truncate ${RARITY_TEXT[rarity]}`}
              >
                {achievement.name}
              </span>
              <span className="text-[11px] text-black/50 leading-tight">
                {achievement.requirement}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
