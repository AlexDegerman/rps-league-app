'use client'

import { useEffect, useState, useRef } from 'react'
import { speakOracle } from '@/lib/oracleTTS'
import { useUIStore } from '@/app/stores/uiStore'

export interface OracleTickerMessage {
  id: string
  content: React.ReactNode
  speech?: string
  accentColor?: string
  durationMs?: number
}

interface OracleMessageTickerProps {
  message: OracleTickerMessage | null
  onDismiss: () => void
}

interface ExplosionDot {
  id: number
  x: number
  y: number
  size: number
  color: string
  delay: number
}

function MiniExplosion({ color }: { color: string }) {
  const [dots] = useState<ExplosionDot[]>(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 80,
      y: (Math.random() - 0.5) * 20,
      size: 1.5 + Math.random() * 2.5,
      color,
      delay: Math.random() * 0.2
    }))
  )
  return (
    <div className="oracle-explosion pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((d) => (
        <div
          key={d.id}
          className="oracle-explosion-dot absolute top-1/2 left-1/2 opacity-0"
          style={
            {
              width: d.size,
              height: d.size,
              borderRadius: '50%',
              background: d.color,
              boxShadow: `0 0 ${d.size * 2}px ${d.color}`,
              '--ox': `${d.x}px`,
              '--oy': `${d.y}px`,
              animationDelay: `${d.delay}s`
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}

export default function OracleMessageTicker({
  message,
  onDismiss
}: OracleMessageTickerProps) {
  const [animOut, setAnimOut] = useState(false)
  const [showExplosion, setShowExplosion] = useState(true)

  const oracleTTSEnabled = useUIStore((s) => s.oracleTTSEnabled)
  const oracleVolume = useUIStore((s) => s.oracleVolume)

  const dismissRef = useRef(onDismiss)
  const messageRef = useRef(message)

  useEffect(() => {
    dismissRef.current = onDismiss
    messageRef.current = message
  })

  useEffect(() => {
    const currentMessage = messageRef.current
    if (!currentMessage) return

    const explosionTimer = setTimeout(() => setShowExplosion(false), 800)

    let ttsTimer: ReturnType<typeof setTimeout> | null = null
    if (oracleTTSEnabled && currentMessage.speech) {
      const text = currentMessage.speech
      ttsTimer = setTimeout(() => speakOracle(text, oracleVolume), 300)
    }

    const duration = currentMessage.durationMs ?? 5000

    const exitAnimTimer = setTimeout(() => {
      setAnimOut(true)
    }, duration)

    const unmountTimer = setTimeout(() => {
      dismissRef.current()
    }, duration + 400)

    return () => {
      clearTimeout(explosionTimer)
      if (ttsTimer) clearTimeout(ttsTimer)
      clearTimeout(exitAnimTimer)
      clearTimeout(unmountTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message?.id])

  if (!message) return null

  const accent = message.accentColor ?? '#a855f7'

  const handleManualDismiss = () => {
    setAnimOut(true)
    setTimeout(() => {
      dismissRef.current()
    }, 400)
  }

  return (
    <div
      className={`relative overflow-hidden h-9 flex items-center transition-all duration-500 border-b border-gray-100/50 ${
        animOut ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'
      }`}
      style={{ background: `${accent}10`, backdropFilter: 'blur(10px)' }}
    >
      <div className="absolute inset-0 sheen-effect opacity-10 pointer-events-none" />
      {showExplosion && <MiniExplosion color={accent} />}

      <div className="relative z-10 w-full px-4 flex items-center gap-3">
        <span className="text-xs shrink-0 animate-pulse drop-shadow-sm">
          👁️
        </span>
        <div className="flex-1 overflow-hidden relative flex items-center h-full">
          <div
            className="oracle-scroll-content whitespace-nowrap"
            style={{ animationDuration: '5s' }}
          >
            <span
              className="text-[10px] font-black uppercase tracking-[0.15em] inline-block pr-24"
              style={{ color: accent, textShadow: `0 0 10px ${accent}40` }}
            >
              {message.content}
            </span>
            <span
              className="text-[10px] font-black uppercase tracking-[0.15em] inline-block pr-24"
              style={{ color: accent, textShadow: `0 0 10px ${accent}40` }}
            >
              {message.content}
            </span>
          </div>
        </div>
        <button
          onClick={handleManualDismiss}
          className="shrink-0 p-1 hover:scale-110 transition-transform opacity-30 hover:opacity-100"
          style={{ color: accent }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  )
}
