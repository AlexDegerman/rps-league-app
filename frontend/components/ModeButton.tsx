'use client'

import type { VisualMode, FestivalModeKey } from '@/types/rps'

interface ModeButtonProps {
  visualMode: VisualMode
  festivalModeKey?: FestivalModeKey | null
  label: string
  onClick: () => void
  className?: string
}

const MODE_BTN_CLASS: Record<string, string> = {
  flash_lunar: 'lunar-btn',
  flash_electric: 'electric-btn',
  flash_cards: 'cards-btn',
  flash_hellfire: 'flash-hellfire-btn',
  winstreak_inferno: 'inferno-btn',
  winstreak_fever: 'fever-btn'
}

const FESTIVAL_BTN_CLASS: Record<string, string> = {
  festival_ghost: 'bg-teal-500 hover:bg-teal-600 text-white',
  festival_safeguard: 'bg-slate-500 hover:bg-slate-600 text-white',
  festival_resonance: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  festival_surge: 'bg-cyan-500 hover:bg-cyan-600 text-white',
  festival_vault: 'bg-indigo-500 hover:bg-indigo-600 text-white',
  festival_spark: 'electric-btn',
  festival_sanguine: 'bg-red-800 hover:bg-red-900 text-white',
  festival_fever: 'bg-orange-600 text-white'
}

export default function ModeButton({
  visualMode,
  festivalModeKey = null,
  label,
  onClick,
  className = ''
}: ModeButtonProps) {
  const btnClass =
    visualMode && visualMode in MODE_BTN_CLASS
      ? MODE_BTN_CLASS[visualMode as string]
      : festivalModeKey && festivalModeKey in FESTIVAL_BTN_CLASS
        ? FESTIVAL_BTN_CLASS[festivalModeKey as string]
        : 'bg-purple-600 hover:bg-purple-700 text-white'

  return (
    <button
      onClick={onClick}
      className={`flex-1 px-3 py-2 text-[10px] sm:text-xs font-black rounded-lg active:scale-95 transition-all shadow-sm whitespace-nowrap ${btnClass} ${className}`}
    >
      {label}
    </button>
  )
}
