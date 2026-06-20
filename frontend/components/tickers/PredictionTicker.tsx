'use client'

import React, { useEffect, useRef, useState } from 'react'
import { generateNickname } from '@/lib/nicknames'
import { formatTickerPoints, getAmountColor } from '@/lib/format'
import { getUserId } from '@/lib/user'
import { useGameStore } from '@/app/stores/gameStore'
import { EVENT_TICKER_CONFIG } from '@/lib/eventConfig'
import GemIcon from '../icons/GemIcon'

export interface TickerEvent {
  id: string
  message: string
  isReal: boolean
  timestamp: number
  amount?: bigint
  parsedMessage?: React.ReactNode
}

const demoTemplates = [
  (name: string, amt: string) => `${name} won ${amt} points`,
  (name: string, amt: string) => `${name} lost ${amt} points`
]

const parseMessageWithGem = (message: string) => {
  const parts = message.split('points')
  return parts.map((part, index, array) => (
    <span key={index} className="inline-flex items-center">
      {part}
      {index < array.length - 1 && (
        <GemIcon
          size={14}
          className="mx-1 text-purple-500! -translate-y-px shrink-0"
        />
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
  const cleanupTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(
    new Set()
  )
  const liveTheme = useGameStore((s) => s.liveTheme)
  const festivalModeKey = useGameStore((s) => s.festivalModeKey)
  const visualMode = useGameStore((s) => s.visualMode)
  const rawKey = liveTheme ?? festivalModeKey ?? null
  const latestPredictionResult = useGameStore((s) => s.latestPredictionResult)
  const tcfg =
    rawKey && rawKey in EVENT_TICKER_CONFIG
      ? EVENT_TICKER_CONFIG[rawKey as keyof typeof EVENT_TICKER_CONFIG]
      : null

  const modeKey = visualMode || festivalModeKey || null

  useEffect(() => {
    if (!latestPredictionResult) return
    if (document.hidden) return

    const data = latestPredictionResult
    const isMe = data.userId === getUserId()
    const amount = BigInt(data.amount)
    if (isMe && data.result === 'LOSE' && amount === 50000n) return

    const name = data.nickname ?? 'Someone'
    const displayName = isMe ? 'You' : name
    const verb = data.result === 'WIN' ? 'won' : 'lost'
    const formattedAmt = formatTickerPoints(amount)
    const rawMsg = `${displayName} ${verb} ${formattedAmt} points`

    pendingRef.current.unshift({
      id: crypto.randomUUID(),
      message: rawMsg,
      isReal: true,
      timestamp: Date.now(),
      amount,
      parsedMessage: parseMessageWithGem(rawMsg)
    })
  }, [latestPredictionResult])

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

  useEffect(() => {
    let demoTimer: ReturnType<typeof setTimeout>
    const scheduleDemoEvent = () => {
      const isMobile = window.innerWidth < 768
      const delay = isMobile
        ? 2000 + Math.random() * 1000
        : 1000 + Math.random() * 1000 

      demoTimer = setTimeout(() => {
        if (visible && !document.hidden && pendingRef.current.length < 10) {
          const name = generateNickname()
          const tierRoll = Math.random() * 100
          let amount = 0n

          if (tierRoll < 15)
            amount = BigInt(Math.floor(Math.random() * 801) + 200) * 10n ** 3n
          else if (tierRoll < 75)
            amount = BigInt(Math.floor(Math.random() * 998) + 1) * 10n ** 6n
          else if (tierRoll < 90)
            amount = BigInt(Math.floor(Math.random() * 900) + 1) * 10n ** 9n
          else if (tierRoll < 99)
            amount =
              BigInt(Math.floor(Math.random() * 900) + 1) *
              (Math.random() > 0.7 ? 10n ** 18n : 10n ** 12n)
          else amount = BigInt(Math.floor(Math.random() * 50) + 1) * 10n ** 21n

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

  useEffect(() => {
    const currentTimeouts = cleanupTimeoutsRef.current
    let activeTimer: ReturnType<typeof setTimeout> | null = null

    const tick = () => {
      if (pendingRef.current.length === 0 || !visible || document.hidden) {
        activeTimer = setTimeout(tick, 500)
        return
      }

      const now = Date.now()
      const isMobile = window.innerWidth < 768
      const lastEvent = lastEventRef.current
      let minDelay = 650

      if (lastEvent) {
        minDelay =
          ((lastEvent.message.length * 8 + 60) / velocity) * 1000 +
          (isMobile ? 1600 : 1000)
      }

      const hasRealEvent = pendingRef.current.some((e) => e.isReal)
      const finalDelay = hasRealEvent ? Math.max(300, minDelay * 0.7) : minDelay

      if (now - lastStartTimeRef.current < finalDelay) {
        activeTimer = setTimeout(tick, 300)
        return
      }

      const realIndex = pendingRef.current.findIndex((e) => e.isReal)
      const next =
        realIndex !== -1
          ? pendingRef.current.splice(realIndex, 1)[0]
          : pendingRef.current.shift()!

      lastEventRef.current = next
      const estimatedWidth = next.message.length * 8 + 50
      const screenWidth = window.innerWidth
      const totalDistance = screenWidth + estimatedWidth
      const eventDuration = (totalDistance / velocity) * 1000

      lastStartTimeRef.current = now
      setActive((prev) => {
        const nextActive = [...prev, { ...next, duration: eventDuration }]
        return nextActive.slice(-5)
      })

      const removalId = setTimeout(() => {
        setActive((prev) => prev.filter((e) => e.id !== next.id))
        currentTimeouts.delete(removalId)
      }, eventDuration + 500)
      currentTimeouts.add(removalId)

      activeTimer = setTimeout(tick, 400)
    }

    tick()

    return () => {
      if (activeTimer) clearTimeout(activeTimer)
      currentTimeouts.forEach(clearTimeout)
      currentTimeouts.clear()
    }
  }, [velocity, visible])

  if (!visible)
    return (
      <button
        onClick={() => setVisible(true)}
        className="fixed bottom-2 right-3 text-[10px] font-bold px-3 py-1.5 bg-white border border-gray-200 rounded-full shadow-lg text-gray-400 hover:text-gray-600 z-50 uppercase"
      >
        Show Feed
      </button>
    )

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 backdrop-blur-sm shadow-[0_-4px_12px_rgba(0,0,0,0.05)] px-4 flex items-center h-8 overflow-hidden 
      ${tcfg?.borderClass ?? 'border-t border-gray-100'} 
      ${modeKey ? `event-side-${modeKey}` : ''}`}
    >
      <div className="absolute inset-0 bg-white -z-20" />

      {modeKey && (
        <div className={`absolute inset-0 -z-10 event-bg-${modeKey}`} />
      )}

      {modeKey && (
        <div className={`event-dynamic-particles particles-${modeKey}`} />
      )}

      {tcfg?.topGlowClass && modeKey && (
        <div
          className={`absolute top-0 left-0 right-0 h-px pointer-events-none ${tcfg.topGlowClass}`}
        />
      )}

      <div className="w-full flex items-center gap-3 relative z-10">
        <span className="text-[10px] font-black text-gray-400 shrink-0 uppercase tracking-widest flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full animate-pulse ${modeKey && tcfg?.dotClass ? tcfg.dotClass : 'bg-green-500'}`}
          />
          <span className="hidden min-[400px]:inline">Live</span>
        </span>

        <div
          className="flex-1 relative h-9 overflow-hidden"
          style={{ clipPath: 'inset(0)' }}
        >
          {active.map((event) => (
            <div
              key={event.id}
              className="absolute whitespace-nowrap text-sm font-medium top-1/2 -translate-y-1/2 left-0 inline-flex items-center gap-1"
              style={{
                animation: `ticker-ltr ${event.duration}ms linear forwards`,
                willChange: 'transform'
              }}
            >
              {event.isReal && (
                <span className="text-red-500 animate-pulse leading-none shrink-0">
                  ●
                </span>
              )}
              <span
                className={`inline-flex items-center gap-0 ${getAmountColor(event.amount)}`}
              >
                {event.parsedMessage}
              </span>
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
