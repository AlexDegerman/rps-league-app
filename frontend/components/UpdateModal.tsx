'use client'
import { X } from 'lucide-react'

interface UpdateModalProps {
  onClose: () => void
}

export default function UpdateModal({ onClose }: UpdateModalProps) {
  const latestUpdate = {
    version: '1.8',
    label: 'Daily Oracle & Point Style Customization',
    notes: [
      'Daily Oracle Prophecy: A server-side AI analyst now issues one guaranteed prediction per day. The Oracle picks a side before the match and rigs the outcome in your favor, follow it and win. The prophecy resets at midnight UTC.',
      'Tamper-Proof Oracle: Oracle usage is tracked server-side in the database, not localStorage. Clearing browser data does not grant additional uses. One prophecy per player per day, enforced at the prediction layer.',
      "Oracle Glow: The pending match card highlights the Oracle's predicted side with a distinctive purple pulse animation, making the recommended bet visually unmistakable.",
      'Point Style Customization: Players can now pin a preferred visual style for their point display from their profile page. 32 tiers available from Million to Octovigintillion, unlocked by reaching the corresponding all-time peak threshold. Cosmetic only.',
      'Auto-Style Mode: Enabled by default. Automatically advances your display to the highest tier you have reached. Can be overridden at any time by selecting a specific style manually.',
      'All-Time Peak Tracking: Introduced a permanent all_time_peak column that is never reset by daily or weekly cycles, used as the authoritative source for style unlock eligibility.'
    ]
  }

  return (
    <div className="fixed inset-x-0 top-0 bottom-14 z-50 flex items-center justify-center px-4 h-[calc(100svh-56px)]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden max-h-[80svh] flex flex-col">
          <div className="h-1.5 w-full bg-linear-to-r from-green-400 via-emerald-500 to-teal-400 shrink-0" />

          <div className="px-6 pt-6 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-600">
                  New Update v{latestUpdate.version}
                </span>
                <h2 className="text-lg font-black text-gray-900 leading-tight">
                  What&apos;s New
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 min-h-0 px-6">
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-6">
              <h3 className="text-xs font-bold text-gray-800 mb-3 uppercase tracking-wide">
                {latestUpdate.label}
              </h3>
              <ul className="space-y-3">
                {latestUpdate.notes.map((note, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <div className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-green-500" />
                    <p className="text-[11px] text-gray-600 font-medium leading-relaxed">
                      {note}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="px-6 pb-6 shrink-0">
            <button
              onClick={onClose}
              className="w-full py-4 bg-gray-900 hover:bg-black active:scale-[0.98] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
