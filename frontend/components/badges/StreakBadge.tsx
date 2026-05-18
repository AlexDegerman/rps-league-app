interface StreakBadgeProps {
  winStreak: number
  streakMult: number
}

export default function StreakBadge({
  winStreak,
  streakMult
}: StreakBadgeProps) {
  if (winStreak < 3) return null

  const isInferno = winStreak >= 5

  return (
    <div
      className={`relative overflow-hidden rounded-xl border-2 px-2 py-1.5 w-full max-w-40 min-w-0 ${
        isInferno
          ? 'bg-linear-to-br from-orange-950 via-red-950 to-orange-950 border-orange-500'
          : 'bg-linear-to-br from-green-950 via-emerald-950 to-green-950 border-green-500'
      }`}
      style={{
        animation: 'fever-badge-in 0.4s cubic-bezier(.34,1.56,.64,1) both'
      }}
    >
      {/* Shimmer sweep */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background: isInferno
            ? 'linear-gradient(90deg, transparent, rgba(249,115,22,0.4), transparent) 0 0 / 200% auto'
            : 'linear-gradient(90deg, transparent, rgba(34,197,94,0.4), transparent) 0 0 / 200% auto',
          animation: 'streak-shimmer 2s linear infinite'
        }}
      />

      <div className="relative z-10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <span className="text-base leading-none">
            {isInferno ? '🔥' : '⚡'}
          </span>
          <span
            className={`text-[10px] font-black uppercase tracking-widest leading-none max-[350px]:tracking-tighter ${
              isInferno ? 'inferno-shimmer-text' : 'streak-shimmer-text'
            }`}
          >
            {isInferno ? 'INFERNO MODE' : 'FEVER TIME'}
          </span>
        </div>
        <div className="flex gap-1 shrink-0">
          {[3, 4, 5].map((threshold) => (
            <div
              key={threshold}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                winStreak >= threshold
                  ? threshold === 5
                    ? 'bg-orange-400 shadow-[0_0_6px_rgba(249,115,22,1)]'
                    : 'bg-green-400 shadow-[0_0_6px_rgba(34,197,94,1)]'
                  : 'bg-gray-700 opacity-40'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-between mt-1">
        <span className="text-[9px] font-bold text-gray-400 uppercase">
          {winStreak} STREAK
        </span>
        <span
          className={`text-[9px] font-black ${isInferno ? 'text-orange-400' : 'text-green-400'}`}
        >
          x{streakMult} MULT
        </span>
      </div>
    </div>
  )
}
