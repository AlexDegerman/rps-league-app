'use client'

import { useEffect, useRef, useState } from 'react'
import { generateNickname } from '@/lib/nicknames'
import { formatPoints } from '@/lib/format'

export interface TickerEvent {
  id: string
  message: string
  isReal: boolean
  timestamp: number
  amount?: number
}

interface PredictionTickerProps {
  events: TickerEvent[]
}
const demoTemplates = [
  (name: string, amt: number) =>
    `${name} won ${amt.toLocaleString()} points!`,
  (name: string, amt: number) =>
    `${name} lost ${amt.toLocaleString()} points.`,
  (name: string, amt: number) =>
    `${name} went all-in and won ${amt.toLocaleString()} points!`,
  (name: string, amt: number) =>
    `${name} is on a winning streak with ${amt.toLocaleString()} points!`,
  (name: string, amt: number) =>
    `${name} reached a new peak of ${amt.toLocaleString()} points!`
]

const getAmountColor = (amount?: number): string => {
  if (!amount) return 'text-gray-400'
  if (amount >= 50_000_000_000) return 'text-red-500'
  if (amount >= 10_000_000) return 'text-yellow-500'
  if (amount >= 100_000) return 'text-purple-500'
  if (amount >= 10_000) return 'text-blue-500'
  return 'text-gray-400'
}

export default function PredictionTicker({ events }: PredictionTickerProps) {
  const [visible, setVisible] = useState(true)
  const [active, setActive] = useState<
    (TickerEvent & { startDelay: number })[]
  >([])
  const pendingRef = useRef<TickerEvent[]>([])
  const lastStartRef = useRef<number>(0)

  useEffect(() => {
    let demoTimer: ReturnType<typeof setTimeout>

    const scheduleDemoEvent = () => {
      const delay = 2000 + Math.random() * 3000
      demoTimer = setTimeout(() => {
        const name = generateNickname()

        // Tiered random amount
        const tierRoll = Math.random() * 100
        let amount = 0
        if (tierRoll < 60) {
          // Tier 1: 2k–10k
          amount = Math.floor(Math.random() * (10_000 - 2_000 + 1) + 2_000)
        } else if (tierRoll < 80) {
          // Tier 2: 10k–100k
          amount = Math.floor(Math.random() * (100_000 - 10_000 + 1) + 10_000)
        } else if (tierRoll < 90) {
          // Tier 3: 100k–1M
          amount = Math.floor(
            Math.random() * (1_000_000 - 100_000 + 1) + 100_000
          )
        } else if (tierRoll < 96) {
          // Tier 4: 1M–1B
          amount = Math.floor(
            Math.random() * (1_000_000_000 - 1_000_000 + 1) + 1_000_000
          )
        } else if (tierRoll < 99) {
          // Tier 5: 1B–50B
          amount = Math.floor(
            Math.random() * (50_000_000_000 - 1_000_000_000 + 1) + 1_000_000_000
          )
        } else {
          // Tier 6: 50.1B–500B
          amount = Math.floor(
            Math.random() * (500_000_000_000 - 50_100_000_000 + 1) +
              50_100_000_000
          )
        }

        const template =
          demoTemplates[Math.floor(Math.random() * demoTemplates.length)]
        pendingRef.current.push({
          id: crypto.randomUUID(),
          message: template(name, formatPoints(amount)),
          isReal: false,
          timestamp: Date.now(),
          amount
        })
        scheduleDemoEvent()
      }, delay)
    }

    scheduleDemoEvent()
    return () => clearTimeout(demoTimer)
  }, [])

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
              event.isReal
                ? `${getAmountColor(event.amount)} font-bold`
                : getAmountColor(event.amount)
            }`}
            style={{ animation: 'ticker-slide 5s linear forwards' }}
          >
            {event.isReal && <span className="text-red-400 mr-1">●</span>}
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
