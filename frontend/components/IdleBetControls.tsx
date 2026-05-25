'use client'

import { useIdleStore } from '@/app/stores/idleStore'
import { useUIStore } from '@/app/stores/uiStore'

export default function IdleBetControls() {
  const { isEligible, idleSide, setIdleSide, setHasInteractedWithIdle } =
    useIdleStore()
  const { setNotification } = useUIStore()

  const handleToggle = (side: 'left' | 'right') => {
    if (!isEligible) return

    setHasInteractedWithIdle(true)
    setNotification(null)

    setIdleSide(idleSide === side ? null : side)
  }

  const baseBtn =
    'h-7.5 px-2 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-tighter transition-all border flex items-center justify-center gap-1 shadow-sm active:scale-95'

  const getStyle = (side: 'left' | 'right') => {
    const isActive = idleSide === side
    if (!isEligible)
      return 'border-gray-100 bg-gray-50 text-gray-300 opacity-60 cursor-help'
    return isActive
      ? 'border-indigo-600 bg-indigo-600 text-white'
      : 'border-gray-200 bg-white text-gray-400 hover:border-indigo-300 hover:text-indigo-600'
  }

  const tooltip = isEligible
    ? 'Toggle automatic betting for this side'
    : 'Unlock by becoming eligible for Lap 1'

  return (
    <div className="flex justify-between items-center mb-2 px-0.5">
      <button
        type="button"
        title={tooltip}
        disabled={!isEligible}
        onClick={() => handleToggle('left')}
        className={`${baseBtn} ${getStyle('left')} tooltip-left`}
      >
        <span className="text-[10px]">⚡</span>
        <span className="hidden sm:inline">AUTO-BET</span>
        <span>LEFT</span>
        {!isEligible && <span className="text-[8px]">🔒</span>}
      </button>

      <div className="flex sm:hidden flex-col items-center justify-center pointer-events-none">
        <span className="text-[7px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none">
          Auto-Bet
        </span>
        {idleSide && (
          <span className="text-[6px] font-bold text-indigo-500 animate-pulse mt-0.5">
            ACTIVE
          </span>
        )}
      </div>

      <button
        type="button"
        title={tooltip}
        disabled={!isEligible}
        onClick={() => handleToggle('right')}
        className={`${baseBtn} ${getStyle('right')} tooltip-right`}
      >
        {!isEligible && <span className="text-[8px]">🔒</span>}
        <span className="hidden sm:inline">AUTO-BET</span>
        <span>RIGHT</span>
        <span className="text-[10px]">⚡</span>
      </button>
    </div>
  )
}
