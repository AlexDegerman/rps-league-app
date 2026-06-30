'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  X,
  Gem,
  Settings,
  Zap,
  Search,
  Moon,
  CloudLightning,
  Spade,
  Flame,
  Cpu,
  Waves,
  ShieldCheck,
  Repeat,
  BatteryCharging,
  CircuitBoard,
  Fingerprint,
  Anchor,
  Diamond,
  LucideIcon
} from 'lucide-react'
import { RARITY_STYLES } from '@/lib/relics'
import { useRelicStore } from '@/app/stores/relicStore'
import { useSound } from '@/hooks/useSound'
import { useUIStore } from '@/app/stores/uiStore'

const ICON_MAP: Record<string, LucideIcon> = {
  Settings,
  Zap,
  Search,
  Moon,
  CloudLightning,
  Spade,
  Flame,
  Cpu,
  Waves,
  ShieldCheck,
  Repeat,
  Gem,
  BatteryCharging,
  CircuitBoard,
  Fingerprint,
  Anchor,
  Diamond
}

export default function RelicDropPopup() {
  const activePopup = useUIStore((s) => s.activePopup)
  const dequeuePopup = useUIStore((s) => s.dequeuePopup)
  const readyToShow = useUIStore((s) => s.readyToShow)

  const dropQueue = useRelicStore((s) => s.dropQueue)
  const popDropQueue = useRelicStore((s) => s.popDropQueue)
  const equipRelic = useRelicStore((s) => s.equipRelic)
  const { playRelicDrop } = useSound()
  const [visible, setVisible] = useState(false)
  const [equipping, setEquipping] = useState(false)

  const currentDrop = dropQueue[0] || null

  const dismiss = useCallback(() => {
    setVisible(false)
    setTimeout(() => {
      popDropQueue()
      dequeuePopup()
    }, 300)
  }, [popDropQueue, dequeuePopup])

  const soundPlayedRef = useRef(false)

  useEffect(() => {
    if (activePopup?.kind === 'relic_drop' && readyToShow && currentDrop) {
      Promise.resolve().then(() => {
        setVisible(true)
      })

      if (!soundPlayedRef.current) {
        soundPlayedRef.current = true
        playRelicDrop(currentDrop.rarity)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePopup?.kind, readyToShow, currentDrop])

  const handleEquip = async () => {
    if (!currentDrop) return
    setEquipping(true)
    try {
      await equipRelic(currentDrop)
      dismiss()
    } finally {
      setEquipping(false)
    }
  }

  if (!currentDrop) return null

  const rarity = currentDrop.rarity
  const styles = RARITY_STYLES[rarity]
  const Icon = ICON_MAP[currentDrop.icon] ?? Gem

  const bloomColors: Record<string, string> = {
    COMMON: 'rgba(34, 197, 94, 0.4)',
    RARE: 'rgba(59, 130, 246, 0.4)',
    EPIC: 'rgba(168, 85, 247, 0.5)',
    LEGENDARY: 'rgba(245, 158, 11, 0.6)',
    MYTHICAL: 'rgba(239, 68, 68, 0.7)'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-700 ${visible ? 'opacity-100 pointer-events-auto' : 'opacity-0'}`}
        onClick={dismiss}
      />
      <div
        className={`relative pointer-events-auto w-full max-w-sm transition-all duration-500 ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-90'}`}
      >
        <div
          className="discovery-spectacle-bloom"
          style={
            { '--bloom-color': bloomColors[rarity] } as React.CSSProperties
          }
        />
        <div
          className={`relative w-full rounded-[40px] p-8 border-2 bg-slate-900 ${styles.border}`}
        >
          <div className="flex items-center justify-between mb-8">
            <span
              className={`text-[10px] font-black uppercase tracking-[0.3em] ${styles.text}`}
            >
              Discovery Found
            </span>
            <button
              onClick={dismiss}
              className="p-2 rounded-full bg-black/20 text-gray-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex flex-col items-center text-center gap-6 mb-10">
            <div
              className={`w-24 h-24 rounded-3xl flex items-center justify-center bg-gray-900 border-2 shadow-2xl ${styles.border} ${styles.glow}`}
            >
              <Icon size={48} className={styles.text} />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white tracking-tighter leading-tight">
                {currentDrop.name}
              </h3>
              <div
                className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block ${styles.bg} ${styles.text} border ${styles.border}`}
              >
                {rarity} Tier
              </div>
            </div>
            <p className="text-[13px] text-gray-200 font-bold leading-relaxed px-4 italic opacity-90">
              {currentDrop.effect}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={dismiss}
              className="flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-gray-400 bg-black/20 hover:bg-black/40 transition-all border border-white/5"
            >
              Dismiss
            </button>
            <button
              onClick={handleEquip}
              disabled={equipping}
              className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all shadow-lg active:scale-95 disabled:opacity-40 ${styles.text} ${styles.border} ${styles.bg} hover:brightness-125`}
            >
              {equipping ? '...' : 'Equip Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
