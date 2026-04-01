'use client'

import { useEffect, useRef, useState } from 'react'

export interface TickerEvent {
  id: string
  message: string
  isReal: boolean
  timestamp: number
}

interface PredictionTickerProps {
  events: TickerEvent[]
}

export default function PredictionTicker({ events }: PredictionTickerProps) {
  const [visible, setVisible] = useState(true)
  const [active, setActive] = useState<
    (TickerEvent & { startDelay: number })[]
  >([])
  const pendingRef = useRef<TickerEvent[]>([])
  const lastStartRef = useRef<number>(0)

  useEffect(() => {
    if (events.length === 0) return
    const latest = events[events.length - 1]
    pendingRef.current.push(latest)
  }, [events])

  useEffect(() => {
    const interval = setInterval(() => {
      if (pendingRef.current.length === 0) return
      const next = pendingRef.current.shift()!
      const now = Date.now()
      // Ensure at least 1.5s gap between starts
      const minStart = lastStartRef.current + 1500
      const startDelay = Math.max(0, minStart - now)
      lastStartRef.current = now + startDelay

      setTimeout(() => {
        setActive((prev) => [...prev, { ...next, startDelay: 0 }])
        setTimeout(() => {
          setActive((prev) => prev.filter((e) => e.id !== next.id))
        }, 5500)
      }, startDelay)
    }, 300)

    return () => clearInterval(interval)
  }, [])

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="fixed bottom-3 right-3 text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full shadow text-gray-500 hover:bg-gray-50 cursor-pointer z-40"
      >
        Show feed
      </button>
    )
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-md px-4 py-2 flex items-center gap-3">
      <span className="text-xs font-bold text-gray-400 shrink-0 uppercase tracking-wide">
        Live
      </span>
      <div className="flex-1 relative h-5" style={{ clipPath: 'inset(0)' }}>
        {active.length === 0 && (
          <p className="text-sm text-gray-300 absolute top-0 left-0">
            Waiting for activity...
          </p>
        )}
        {active.map((event) => (
          <p
            key={event.id}
            className={`absolute whitespace-nowrap text-sm top-0 left-0 ${
              event.isReal ? 'text-gray-800 font-medium' : 'text-gray-400'
            }`}
            style={{ animation: 'ticker-slide 5s linear forwards' }}
          >
            {event.message}
          </p>
        ))}
      </div>
      <button
        onClick={() => setVisible(false)}
        className="text-xs text-gray-400 hover:text-gray-600 shrink-0 cursor-pointer"
      >
        Hide
      </button>
    </div>
  )
}
