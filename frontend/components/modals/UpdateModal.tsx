'use client'
import { X } from 'lucide-react'
import { LATEST_UPDATE } from '@/lib/updates'

interface UpdateModalProps {
  onClose: () => void
}

export default function UpdateModal({ onClose }: UpdateModalProps) {
  return (
    <div className="fixed inset-x-0 top-0 bottom-14 z-60 flex items-center justify-center px-4 h-[calc(100svh-56px)]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden max-h-[70svh] flex flex-col">
          <div className="h-1.5 w-full bg-linear-to-r from-green-400 via-emerald-500 to-teal-400 shrink-0" />

          <div className="px-6 pt-4 pb-1 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-green-600 leading-none mb-1">
                  New Update v{LATEST_UPDATE.version}
                </span>
                <h2 className="text-lg font-black text-gray-900 leading-tight">
                  What&apos;s New
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 -mr-2"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 custom-scrollbar relative">
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-2">
              <h3 className="text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest">
                {LATEST_UPDATE.label}
              </h3>
              <ul className="space-y-3.5">
                {LATEST_UPDATE.notes.map((note, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <div className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-green-500" />
                    <p className="text-[11px] text-gray-600 font-medium leading-relaxed">
                      {note}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="h-16" />
            </div>

            <div className="sticky bottom-0 left-0 right-0 h-20 bg-linear-to-t from-white via-white/80 to-transparent pointer-events-none -mx-6 z-10" />
          </div>

          <div className="px-6 pb-6 pt-1 shrink-0 bg-white z-20 relative">
            <button
              onClick={onClose}
              className="w-full py-4 bg-gray-900 hover:bg-black active:scale-[0.98] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg"
            >
              Got it
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  )
}
