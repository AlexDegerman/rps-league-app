'use client'

import { X } from 'lucide-react'

interface UpdateModalProps {
  onClose: () => void
}

export default function UpdateModal({ onClose }: UpdateModalProps) {
  const latestUpdate = {
    version: '1.7',
    label: 'Observability and Feedback Portal',
    notes: [
      'Engine Stability: Deployed real-time crash monitoring to ensure win streaks are never interrupted.',
      'Feedback Portal: Report bugs directly from the game. Reports now include your exact game state.',
      'Instant Alerts: Developers are now notified of critical issues for immediate hotfixing.',
      'Spam Protection: New security layers to protect the integrity of the feedback pipeline.'
    ]
  }

  return (
    <div className="fixed inset-x-0 top-0 bottom-14 z-50 flex items-center justify-center px-4 h-[calc(100svh-56px)]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden">
          <div className="h-1.5 w-full bg-linear-to-r from-green-400 via-emerald-500 to-teal-400" />

          <div className="px-6 py-6">
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
