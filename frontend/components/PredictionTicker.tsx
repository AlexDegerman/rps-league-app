'use client'

import { useEffect, useRef, useState } from 'react'
import { generateNickname } from '@/lib/nicknames'
import { formatPoints } from '@/lib/format'
import GemIcon from './icons/GemIcon'

export interface TickerEvent {
  id: string
  message: string
  isReal: boolean
  timestamp: number
  amount?: number
}

interface PredictionTickerProps {
  events: TickerEvent[]
  speed?: number
  pauseDemos?: boolean
}

const demoTemplates = [
  (name: string, amt: string) => `${name} won ${amt} points!`,
  (name: string, amt: string) => `${name} lost ${amt} points.`,
  (name: string, amt: string) => `${name} went all-in and won ${amt} points!`,
  (name: string, amt: string) =>
    `${name} is on a winning streak with ${amt} points!`,
  (name: string, amt: string) => `${name} reached a new peak of ${amt} points!`
]

const getAmountColor = (amount?: number): string => {
  if (!amount) return 'text-gray-400'
  if (amount >= 50_000_000_000) return 'text-red-500'
  if (amount >= 10_000_000) return 'text-yellow-500'
  if (amount >= 100_000) return 'text-purple-500'
  if (amount >= 10_000) return 'text-blue-500'
  return 'text-gray-400'
}

export default function PredictionTicker({
  events,
  speed = 5000,
  pauseDemos = false
}: PredictionTickerProps) {
  const [visible, setVisible] = useState(true)
  const [active, setActive] = useState<
    (TickerEvent & { startDelay: number })[]
  >([])
  const [dynamicDuration, setDynamicDuration] = useState(speed)

  const pendingRef = useRef<TickerEvent[]>([])
  const lastStartRef = useRef<number>(0)
  const pauseDemosRef = useRef(pauseDemos)

  useEffect(() => {
    pauseDemosRef.current = pauseDemos
  }, [pauseDemos])

  useEffect(() => {
    const updateVelocity = () => {
      const width = window.innerWidth
      const v = Math.max(120, Math.min(width / 3, 600))
      const calculatedDuration = ((width + 200) / v) * 1000
      setDynamicDuration(calculatedDuration)
    }
    updateVelocity()
    window.addEventListener('resize', updateVelocity)
    return () => window.removeEventListener('resize', updateVelocity)
  }, [])

  useEffect(() => {
    let demoTimer: ReturnType<typeof setTimeout>
    const scheduleDemoEvent = () => {
      const delay = 2000 + Math.random() * 3000
      demoTimer = setTimeout(() => {
        if (!pauseDemosRef.current) {
          const name = generateNickname()
          const tierRoll = Math.random() * 100
          let amount = 0
          if (tierRoll < 60)
            amount = Math.floor(Math.random() * (10_000 - 2_000 + 1) + 2_000)
          else if (tierRoll < 80)
            amount = Math.floor(Math.random() * (100_000 - 10_000 + 1) + 10_000)
          else if (tierRoll < 90)
            amount = Math.floor(
              Math.random() * (1_000_000 - 100_000 + 1) + 100_000
            )
          else if (tierRoll < 96)
            amount = Math.floor(
              Math.random() * (1_000_000_000 - 1_000_000 + 1) + 1_000_000
            )
          else if (tierRoll < 99)
            amount = Math.floor(
              Math.random() * (50_000_000_000 - 1_000_000_000 + 1) +
                1_000_000_000
            )
          else
            amount = Math.floor(
              Math.random() * (500_000_000_000 - 50_100_000_000 + 1) +
                50_100_000_000
            )

          const template =
            demoTemplates[Math.floor(Math.random() * demoTemplates.length)]
          pendingRef.current.push({
            id: crypto.randomUUID(),
            message: template(name, formatPoints(amount)),
            isReal: false,
            timestamp: Date.now(),
            amount
          })
        }
        scheduleDemoEvent()
      }, delay)
    }
    scheduleDemoEvent()
    return () => clearTimeout(demoTimer)
  }, [])

  useEffect(() => {
    if (events.length === 0) return
    const latest = events[events.length - 1]
    if (latest.isReal) {
      pendingRef.current.unshift(latest)
    } else {
      pendingRef.current.push(latest)
    }
  }, [events])

  useEffect(() => {
    const interval = setInterval(() => {
      if (pendingRef.current.length === 0) return

      const now = Date.now()
      const minGap = 1500

      if (now < lastStartRef.current + minGap) return

      const next = pendingRef.current.shift()!
      lastStartRef.current = now

      setActive((prev) => [...prev, { ...next, startDelay: 0 }])

      setTimeout(() => {
        setActive((prev) => prev.filter((e) => e.id !== next.id))
      }, dynamicDuration + 1000)
    }, 100)

    return () => clearInterval(interval)
  }, [dynamicDuration])

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
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-md px-4 py-2 flex items-center gap-3 h-10">
      <span className="text-[10px] font-bold text-gray-400 shrink-0 uppercase tracking-wide">
        Live
      </span>
      <div
        className="flex-1 relative h-5 overflow-hidden"
        style={{ clipPath: 'inset(0)' }}
      >
        {active.length === 0 && (
          <p className="text-sm text-gray-300 absolute top-0 left-0">
            Waiting for activity...
          </p>
        )}
        {active.map((event) => (
          <p
            key={event.id}
            className={`absolute whitespace-nowrap text-sm top-0 left-0 flex items-center ${
              event.isReal
                ? `${getAmountColor(event.amount)} font-bold`
                : getAmountColor(event.amount)
            }`}
            style={{
              animation: `ticker-ltr ${dynamicDuration}ms linear forwards`
            }}
          >
            {event.isReal && (
              <span className="text-red-400 mr-1 shrink-0">●</span>
            )}

            {event.message.split('points').map((part, index, array) => (
              <span key={index} className="flex items-center">
                {part}
                {index < array.length - 1 && (
                  <GemIcon
                    size={14}
                    className="mx-1 text-purple-500 -translate-y-px"
                  />
                )}
              </span>
            ))}
          </p>
        ))}
      </div>
      <button
        onClick={() => setVisible(false)}
        className="text-[10px] font-bold text-gray-400 hover:text-gray-600 shrink-0 cursor-pointer uppercase"
      >
        Hide
      </button>
    </div>
  )
}
