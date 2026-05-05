type VisualMode =
  | 'flash_lunar'
  | 'flash_electric'
  | 'flash_cards'
  | 'flash_hellfire'
  | 'inferno'
  | 'fever'
  | null

interface ModeButtonProps {
  visualMode: VisualMode
  /** The base label shown in default (no visual mode) state, e.g. "ALL IN" or "AUTO ON" */
  label: string
  onClick: () => void
  className?: string
}

const MODE_EMOJI: Record<NonNullable<VisualMode>, string> = {
  flash_lunar: '🌙',
  flash_electric: '⚡',
  flash_cards: '🃏',
  flash_hellfire: '🔥',
  inferno: '🔥',
  fever: '⚡'
}

const MODE_BTN_CLASS: Record<NonNullable<VisualMode>, string> = {
  flash_lunar: 'lunar-btn',
  flash_electric: 'electric-btn',
  flash_cards: 'cards-btn',
  flash_hellfire: 'flash-hellfire-btn',
  inferno: 'inferno-btn',
  fever: 'fever-btn'
}

export default function ModeButton({
  visualMode,
  label,
  onClick,
  className = ''
}: ModeButtonProps) {
  const btnClass = visualMode
    ? MODE_BTN_CLASS[visualMode]
    : 'bg-purple-600 hover:bg-purple-700 text-white'

  const displayLabel = visualMode ? `${MODE_EMOJI[visualMode]} ${label}` : label

  return (
    <button
      onClick={onClick}
      className={`flex-1 sm:flex-none px-4 py-2 text-xs font-black rounded-lg active:scale-95 transition-all shadow-sm ${btnClass} ${className}`}
    >
      {displayLabel}
    </button>
  )
}
