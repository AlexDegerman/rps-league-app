'use client'

import React, { useEffect, useRef, useState } from 'react'
import { generateNickname } from '@/lib/nicknames'
import { formatTickerPoints, getAmountColor } from '@/lib/format'
import { getUserId } from '@/lib/user'
import GemIcon from './icons/GemIcon'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export interface TickerEvent {
  id: string
  message: string
  isReal: boolean
  timestamp: number
  amount?: number
  parsedMessage?: React.ReactNode
}

const demoTemplates = [
  (name: string, amt: string) => `${name} won ${amt} points`,
  (name: string, amt: string) => `${name} lost ${amt} points`,
  (name: string, amt: string) => `${name} went all-in and won ${amt} points`,
  (name: string, amt: string) =>
    `${name} is on a winning streak with ${amt} points`,
  (name: string, amt: string) => `${name} reached a new peak of ${amt} points`
]

const parseMessageWithGem = (message: string) => {
  const parts = message.split('points')
  return parts.map((part, index, array) => (
    <span key={index} className="flex items-center">
      {part}
      {index < array.length - 1 && (
        <GemIcon size={14} className="mx-1 text-purple-500 -translate-y-px" />
      )}
    </span>
  ))
}

export default function PredictionTicker() {
  const [visible, setVisible] = useState(true)
  const [active, setActive] = useState<(TickerEvent & { duration: number })[]>(
    []
  )
  const [velocity, setVelocity] = useState(220)
  const lastEventRef = useRef<TickerEvent | null>(null)
  const pendingRef = useRef<TickerEvent[]>([])
  const lastStartTimeRef = useRef<number>(0)
  const cleanupTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())

  // 1. SSE Connection
  useEffect(() => {
    const es = new EventSource(`${API_BASE}/api/live`)

    es.addEventListener('prediction_result', (event) => {
      // Don't even process SSE if tab is hidden to prevent background buildup
      if (document.hidden) return

      const data = JSON.parse(event.data)
      const isMe = data.userId === getUserId()
      if (isMe && data.result === 'LOSE' && data.amount === 50000) return
      const name = data.nickname ?? 'Someone'
      const displayName = isMe ? 'You' : name

      const rawMsg =
        data.result === 'WIN'
          ? `${displayName} ${data.wasAllIn ? 'went all-in and won' : 'won'} ${formatTickerPoints(data.amount)} points!`
          : `${displayName} lost ${formatTickerPoints(data.amount)} points.`

      pendingRef.current.unshift({
        id: crypto.randomUUID(),
        message: rawMsg,
        isReal: true,
        timestamp: Date.now(),
        amount: data.amount,
        parsedMessage: parseMessageWithGem(rawMsg)
      })
    })

    return () => es.close()
  }, [])

  // 2. Responsive Velocity
useEffect(() => {
  const updateVelocity = () => {
    const width = window.innerWidth
    setVelocity(Math.max(160, Math.min(width / 2, 400)))
    setActive([])
  }

  updateVelocity()
  window.addEventListener('resize', updateVelocity)
  return () => window.removeEventListener('resize', updateVelocity)
}, [])

  // 3. Generator (Pauses when hidden)
  useEffect(() => {
    let demoTimer: ReturnType<typeof setTimeout>
    const scheduleDemoEvent = () => {
      const delay = 400 + Math.random() * 800
      demoTimer = setTimeout(() => {
        // Only generate if visible AND tab is focused
        if (visible && !document.hidden && pendingRef.current.length < 40) {
          const name = generateNickname()
          const tierRoll = Math.random() * 100
          let amount = 0

          if (tierRoll < 60)
            amount = Math.floor(Math.random() * 700001 + 200000)
          else if (tierRoll < 80)
            amount = Math.floor(Math.random() * 9000001 + 1000000)
          else if (tierRoll < 90)
            amount = Math.floor(Math.random() * 90000001 + 10000000)
          else if (tierRoll < 96)
            amount = Math.floor(Math.random() * 900000001 + 100000000)
          else if (tierRoll < 99)
            amount = Math.floor(Math.random() * 49000000001 + 1000000000)
          else amount = Math.floor(Math.random() * 449900000001 + 50100000000)

          const template =
            demoTemplates[Math.floor(Math.random() * demoTemplates.length)]
          const rawMsg = template(name, formatTickerPoints(amount))

          pendingRef.current.push({
            id: crypto.randomUUID(),
            message: rawMsg,
            isReal: false,
            timestamp: Date.now(),
            amount,
            parsedMessage: parseMessageWithGem(rawMsg)
          })
        }
        scheduleDemoEvent()
      }, delay)
    }
    scheduleDemoEvent()
    return () => clearTimeout(demoTimer)
  }, [visible])

  // 4. The Processor
  useEffect(() => {
    const currentTimeouts = cleanupTimeoutsRef.current

    const handleVisibility = () => {
      if (document.hidden) {
        pendingRef.current = []
        setActive([])
        lastEventRef.current = null
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)

    const interval = setInterval(() => {
      if (pendingRef.current.length === 0 || !visible || document.hidden) return

      const now = Date.now()
      const isMobile = window.innerWidth < 640

      const lastEvent = lastEventRef.current
      let minDelay = 650

      if (lastEvent) {
        const charCount = lastEvent.message.length
        const estimatedWidth = charCount * 8 + 60
        const buffer = isMobile ? 500 : 200
        minDelay = (estimatedWidth / velocity) * 1000 + buffer
      }

      const hasRealEvent = pendingRef.current.some((e) => e.isReal)
      const finalDelay = hasRealEvent ? Math.max(300, minDelay * 0.7) : minDelay

      if (now - lastStartTimeRef.current < finalDelay) return

      const realIndex = pendingRef.current.findIndex((e) => e.isReal)
      let next: TickerEvent
      if (realIndex !== -1) {
        next = pendingRef.current.splice(realIndex, 1)[0]
      } else {
        next = pendingRef.current.shift()!
      }

      lastEventRef.current = next

      const estimatedWidth = next.message.length * 8 + 50
      const screenWidth = window.innerWidth
      const totalDistance = screenWidth + estimatedWidth
      const eventDuration = (totalDistance / velocity) * 1000

      lastStartTimeRef.current = now

      setActive((prev) => [...prev, { ...next, duration: eventDuration }])

      const removalId = setTimeout(() => {
        setActive((prev) => prev.filter((e) => e.id !== next.id))
        currentTimeouts.delete(removalId)
      }, eventDuration + 500)

      currentTimeouts.add(removalId)
    }, 50)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)

      currentTimeouts.forEach((timeoutId) => {
        clearTimeout(timeoutId)
      })
      currentTimeouts.clear()
    }
  }, [velocity, visible])

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="fixed bottom-10 right-3 text-[10px] font-bold px-3 py-1.5 bg-white border border-gray-200 rounded-full shadow-lg text-gray-400 hover:text-gray-600 z-50 uppercase"
      >
        Show Feed
      </button>
    )
  }

  return (
    <div className="fixed bottom-8 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-100 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] px-4 flex items-center h-12">
      <div className="w-full flex items-center gap-3">
        <span className="text-[10px] font-black text-gray-400 shrink-0 uppercase tracking-widest flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="hidden min-[400px]:inline">Live</span>
        </span>

        <div
          className="flex-1 relative h-8 overflow-hidden"
          style={{ clipPath: 'inset(0)' }}
        >
          {active.map((event) => (
            <div
              key={event.id}
              className={`absolute whitespace-nowrap text-sm top-1/2 -translate-y-1/2 left-0 flex items-center gap-1 ${
                event.isReal
                  ? `${getAmountColor(event.amount)} font-black`
                  : `${getAmountColor(event.amount)} font-medium`
              }`}
              style={{
                animation: `ticker-ltr ${event.duration}ms linear forwards`,
                willChange: 'transform'
              }}
            >
              {event.isReal && (
                <span className="text-red-500 animate-pulse">●</span>
              )}
              {event.parsedMessage}
            </div>
          ))}
        </div>

        <button
          onClick={() => setVisible(false)}
          className="text-[10px] font-bold text-gray-300 hover:text-gray-500 shrink-0 uppercase transition-colors"
        >
          Hide
        </button>
      </div>
    </div>
  )
}
