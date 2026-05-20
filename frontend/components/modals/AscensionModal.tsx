'use client'

import { useState } from 'react'

interface Props {
  laps: number
  onAscend: () => Promise<void>
  onDismiss: () => void
}

export default function AscensionModal({ laps, onAscend, onDismiss }: Props) {
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const handleAscend = async () => {
    if (!confirmed) {
      setConfirmed(true)
      return
    }
    setLoading(true)
    await onAscend()
    setLoading(false)
  }

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 backdrop-blur-md px-4 py-4"
      onClick={onDismiss}
    >
      <div
        className="relative rounded-[2.25rem] border-2 border-white/20 shadow-[0_0_80px_rgba(144,205,244,0.4)] max-w-77.5 w-full max-h-[95vh] overflow-y-auto overflow-x-hidden animate-in zoom-in-95 fade-in duration-500 custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 event-bg-lunar" />
        <div className="absolute inset-0 bg-black/70" />
        <div className="event-dynamic-particles particles-lunar opacity-90" />

        <div className="relative pt-2 pb-4 px-5 flex flex-col gap-3.5 z-10">
          {/* Header Area  */}
          <div className="flex flex-col items-center text-center">
            <span className="text-xl g-vg drop-shadow-[0_0_10px_rgba(255,255,255,0.6)] animate-pulse">
              ✦
            </span>
            <div className="flex flex-col -space-y-1">
              <h2 className="text-[22px] font-black tracking-tighter g-uvg uppercase italic leading-none">
                Ascension
              </h2>
              <h2 className="text-[22px] font-black tracking-tighter g-uvg uppercase italic leading-none mt-0.5">
                Ready
              </h2>
            </div>

            <div className="mt-2 flex items-center gap-4 px-5 py-1 bg-white/5 backdrop-blur-md rounded-full border border-white/10 shadow-inner">
              <span className="text-[9px] font-black text-white/50 uppercase tracking-widest leading-none">
                Lap {laps}
              </span>
              <span className="text-indigo-400 text-xs font-bold leading-none select-none">
                →
              </span>
              <span className="text-[11px] font-black g-spd uppercase tracking-tighter leading-none">
                Lap {laps + 1}
              </span>
            </div>
          </div>

          {/* Stats Glass Box */}
          <div className="bg-white/5 backdrop-blur-xl rounded-[1.25rem] border border-white/10 p-4 px-5 flex flex-col gap-3 shadow-2xl">
            <div className="flex justify-between items-center h-4">
              <span className="text-[9px] font-black text-white/30 uppercase tracking-widest leading-none">
                Balance
              </span>
              <span className="text-[11px] font-black g-qiv uppercase tracking-tight leading-none">
                Reset to 200,000
              </span>
            </div>

            <div className="flex justify-between items-center h-4">
              <span className="text-[9px] font-black text-white/30 uppercase tracking-widest leading-none">
                Peak / Relics / Stats
              </span>
              <span className="text-[11px] font-black g-qiv italic uppercase tracking-tight leading-none">
                Preserved
              </span>
            </div>
          </div>

          {/* Descriptive Text Blocks */}
          <div className="px-1 flex flex-col gap-2.5">
            <div className="text-center">
              <p className="text-[9px] font-black g-uvg uppercase tracking-widest mb-0.5 leading-none">
                Route A: The Chrono Lap
              </p>
              <p className="text-[10px] text-white/90 font-bold leading-snug">
                Ascend now to lock in your time and claim your place on the Lap
                Leaderboards.
              </p>
            </div>

            <div className="text-center pt-1.5 border-t border-white/5">
              <p className="text-[9px] font-black g-uvg uppercase tracking-widest mb-0.5 leading-none">
                Route B: Infinite Power
              </p>
              <p className="text-[10px] text-white/90 font-bold leading-snug">
                Decline to keep pushing your current balance for the High Score.
                Trigger later from your profile.
              </p>
            </div>
          </div>

          {/* THEMED ACTION BUTTONS */}
          <div className="flex flex-col gap-2.5">
            {/* PATH 1: ASCEND (Chrono Path) */}
            <button
              onClick={handleAscend}
              disabled={loading}
              className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] transition-all relative overflow-hidden shadow-2xl active:scale-95 border border-white/10 bg-white/5
                ${confirmed ? 'g-dvg scale-[1.03]' : ''}`}
            >
              <div className="absolute inset-0 event-bg-lunar opacity-20" />
              <div className="absolute inset-0 event-dynamic-particles particles-lunar opacity-60 scale-75" />
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer-slide_2s_infinite] pointer-events-none" />

              <span
                className={`relative z-10 ${confirmed ? 'g-qiv drop-shadow-md' : 'g-spd drop-shadow-sm'}`}
              >
                {loading ? '...' : confirmed ? 'Confirm Ascension' : 'Ascend'}
              </span>
            </button>

            {/* PATH 2: HIGH SCORE (Infinite Path) */}
            <button
              onClick={onDismiss}
              className="w-full py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.25em] transition-all relative overflow-hidden shadow-2xl active:scale-95 border border-white/10 bg-white/5"
            >
              <div className="absolute inset-0 event-bg-electric opacity-20" />
              <div className="absolute inset-0 event-dynamic-particles particles-electric opacity-60 scale-75" />
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer-slide_3s_infinite] pointer-events-none" />

              <span className="relative z-10 g-qiv drop-shadow-lg">
                Pursue High Score
              </span>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(144, 205, 244, 0.3);
          border-radius: 10px;
        }
      `}</style>
    </div>
  )
}
