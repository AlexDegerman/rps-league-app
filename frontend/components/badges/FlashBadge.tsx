import { VisualMode } from "@/types/rps"

interface FlashBadgeProps {
  visualMode: VisualMode
  flashBuffRemaining: number
}

const FLASH_CONFIG = {
  flash_lunar: {
    containerClass:
      'bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 border-blue-300',
    emoji: '🌙',
    labelClass: 'lunar-badge-text',
    label: "MOON'S BLESSING",
    countClass: 'bg-blue-900 text-blue-200',
    isCards: false,
    multClass: 'text-blue-300'
  },
  flash_electric: {
    containerClass:
      'bg-linear-to-br from-purple-950 via-violet-950 to-purple-950 border-purple-400',
    emoji: '⚡',
    labelClass: 'electric-badge-text',
    label: 'ELECTRIC SURGE',
    countClass: 'bg-purple-900 text-purple-200',
    isCards: false,
    multClass: 'text-purple-300'
  },
  flash_cards: {
    containerClass:
      'bg-linear-to-br from-yellow-950 via-amber-950 to-yellow-950 border-yellow-400',
    emoji: '🃏',
    labelClass: 'cards-badge-text',
    label: 'LUCK IN THE CARD',
    countClass: 'bg-yellow-900 text-yellow-200',
    isCards: true,
    multClass: ''
  },
  flash_hellfire: {
    containerClass:
      'bg-linear-to-br from-red-950 via-rose-950 to-red-950 border-red-500',
    emoji: '🔥',
    labelClass: 'text-red-300 streak-fire-text',
    label: 'HELLFIRE EVENT',
    countClass: 'bg-red-900 text-red-200',
    isCards: false,
    multClass: 'text-red-300'
  }
} as const

export default function FlashBadge({
  visualMode,
  flashBuffRemaining
}: FlashBadgeProps) {
  if (
    !visualMode ||
    !visualMode.startsWith('flash_') ||
    !(visualMode in FLASH_CONFIG)
  )
    return null

  const cfg = FLASH_CONFIG[visualMode as keyof typeof FLASH_CONFIG]

  return (
    <div
      className={`relative overflow-hidden rounded-xl border-2 px-2 py-1.5 w-full max-w-50 min-w-0 ${cfg.containerClass}`}
      style={{
        animation: 'fever-badge-in 0.4s cubic-bezier(.34,1.56,.64,1) both'
      }}
    >
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1">
          <span className="text-base leading-none">{cfg.emoji}</span>
          <span
            className={`text-[10px] font-black uppercase tracking-widest leading-none ${cfg.labelClass}`}
            style={{ isolation: 'isolate', display: 'inline-block' }}
          >
            {cfg.label}
          </span>
        </div>
        <span
          className={`text-[9px] font-black px-1 py-0.5 rounded-full shrink-0 ${cfg.countClass}`}
        >
          {flashBuffRemaining} LEFT
        </span>
      </div>

      <div className="flex items-center justify-between mt-1">
        <span className="text-[9px] font-bold text-gray-400 uppercase">
          100% WIN
        </span>
        {cfg.isCards ? (
          <span className="text-[9px] font-black cards-badge-text">
            LEG BNS
          </span>
        ) : (
          <span className={`text-[9px] font-black ${cfg.multClass}`}>
            x5 MULT
          </span>
        )}
      </div>
    </div>
  )
}