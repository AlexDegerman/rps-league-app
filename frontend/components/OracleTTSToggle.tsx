'use client'

import { useUIStore } from "@/app/stores/uiStore"


export default function OracleTTSToggle() {
  const oracleTTSEnabled = useUIStore((s) => s.oracleTTSEnabled)
  const toggleOracleTTS = useUIStore((s) => s.toggleOracleTTS)

  return (
    <button
      onClick={toggleOracleTTS}
      title={oracleTTSEnabled ? 'Oracle voice: on' : 'Oracle voice: off'}
      className={`shrink-0 p-1.5 rounded-md transition-all duration-200 text-[10px] font-black uppercase tracking-wider border ${
        oracleTTSEnabled
          ? 'border-purple-500/40 bg-purple-500/10 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.3)]'
          : 'border-gray-700/40 bg-transparent text-gray-600 hover:text-gray-400'
      }`}
    >
      👁️ {oracleTTSEnabled ? 'Voice' : 'Voice'}
    </button>
  )
}
