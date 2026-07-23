'use client'

import React, { useEffect, useRef, useState } from 'react'
import { generateNickname } from '@/lib/nicknames'
import { formatTickerPoints, getAmountColor } from '@/lib/format'
import { getUserId } from '@/lib/user'
import { useGameStore } from '@/app/stores/gameStore'
import { EVENT_TICKER_CONFIG } from '@/lib/eventConfig'
import GemIcon from '../icons/GemIcon'
import { RELICS, type RelicRarity } from '@/lib/relics'
import { ACHIEVEMENT_BADGE_MAP } from '@/lib/achievements'
import { drainActivities, type ActivityBroadcast } from '@/lib/activityFeed'

type EventCategory =
  | 'prediction'
  | 'relic'
  | 'achievement'
  | 'milestone'
  | 'lap'
  | 'streak'
  | 'festival'
  | 'global_event'

interface LiveEvent {
  id: string
  message: string
  parsedMessage: React.ReactNode
  isReal: boolean
  priority: number
  timestamp: number
  amount?: bigint
  color?: string
  category: EventCategory
}

const RELIC_RARITY_COLOR: Record<RelicRarity, string> = {
  COMMON: '#4ade80',
  RARE: '#60a5fa',
  EPIC: '#c084fc',
  LEGENDARY: '#facc15',
  MYTHICAL: '#f87171'
}

const ACH_RARITY_COLOR: Record<string, string> = {
  COMMON: '#6b7280',
  RARE: '#3b82f6',
  EPIC: '#a855f7',
  LEGENDARY: '#f59e0b',
  MYTHICAL: '#ef4444',
  RAINBOW: '#8b5cf6'
}

const FESTIVAL_COLOR: Record<string, string> = {
  SPARK: '#a855f7',
  GHOST: '#4dd0c4',
  SAFEGUARD: '#94a3b8',
  RESONANCE: '#ecc94b',
  SURGE: '#22d3ee',
  VAULT: '#748ffc',
  FEVER: '#f97316',
  SANGUINE: '#991b1b'
}

const BOSS_TYPE_COLOR: Record<string, string> = {
  HEXURION: '#22d3ee',
  ORPHION: '#a855f7',
  FRACTURON: '#22c55e',
  APEXION: '#f97316'
}


const DEMO_MILESTONES = [
  { name: 'Quadrillion', color: '#3b82f6' },
  { name: 'Quintillion', color: '#a855f7' },
  { name: 'Sextillion', color: '#ec4899' },
  { name: 'Septillion', color: '#06b6d4' },
  { name: 'Octillion', color: '#f97316' },
  { name: 'Nonillion', color: '#f59e0b' },
  { name: 'Decillion', color: '#0ea5e9' },
  { name: 'Vigintillion', color: '#dc2626' }
]

const ALL_ACH_CODES = Object.keys(ACHIEVEMENT_BADGE_MAP)

const rand = <T,>(arr: readonly T[] | T[]): T =>
  arr[Math.floor(Math.random() * arr.length)]!

const randomRelicWeighted = () => {
  const r = Math.random()
  const rarity: RelicRarity =
    r < 0.40 ? 'COMMON'
    : r < 0.70 ? 'RARE'
    : r < 0.88 ? 'EPIC'
    : r < 0.97 ? 'LEGENDARY'
    : 'MYTHICAL'
  return (
    rand(RELICS.filter((rl) => rl.rarity === rarity)) ?? rand(RELICS)
  )
}

const randomAchWeighted = () => {
  const code = rand(ALL_ACH_CODES)
  return ACHIEVEMENT_BADGE_MAP[code]!
}

const parseWithGem = (msg: string): React.ReactNode => {
  const parts = msg.split('points')
  return (
    <>
      {parts.map((p, i) => (
        <span key={i} className="inline-flex items-center">
          {p}
          {i < parts.length - 1 && (
            <GemIcon
              size={14}
              className="mx-1 text-purple-500! -translate-y-px shrink-0"
            />
          )}
        </span>
      ))}
    </>
  )
}

const plain = (msg: string): React.ReactNode => <>{msg}</>

function buildDemoEvent(): Omit<LiveEvent, 'id' | 'timestamp'> {
  const roll = Math.random()

  // 50% prediction win / loss
  if (roll < 0.5) {
    const name = generateNickname()
    const tier = Math.random() * 100
    let amount = 0n
    if (tier < 15)
      amount = BigInt(Math.floor(Math.random() * 801) + 200) * 10n ** 3n
    else if (tier < 75)
      amount = BigInt(Math.floor(Math.random() * 998) + 1) * 10n ** 6n
    else if (tier < 90)
      amount = BigInt(Math.floor(Math.random() * 900) + 1) * 10n ** 9n
    else if (tier < 99)
      amount =
        BigInt(Math.floor(Math.random() * 900) + 1) *
        (Math.random() > 0.7 ? 10n ** 18n : 10n ** 12n)
    else amount = BigInt(Math.floor(Math.random() * 50) + 1) * 10n ** 21n

    const isWin = Math.random() < 0.55
    const verb = isWin ? 'won' : 'lost'
    const msg = `${name} ${verb} ${formatTickerPoints(amount)} points`
    return {
      message: msg,
      parsedMessage: parseWithGem(msg),
      isReal: false,
      priority: 4,
      category: 'prediction',
      amount
    }
  }

  const s = Math.random()

  // 18% relic find
  if (s < 0.18) {
    const relic = randomRelicWeighted()
    const name = generateNickname()
    const color = RELIC_RARITY_COLOR[relic.rarity]
    const msg = `🧿 ${name} unearthed ${relic.rarity}: ${relic.name}`
    return {
      message: msg,
      parsedMessage: plain(msg),
      isReal: false,
      priority: 3,
      category: 'relic',
      color
    }
  }

  // 18% achievement
  if (s < 0.36) {
    const ach = randomAchWeighted()
    const name = generateNickname()
    const color = ACH_RARITY_COLOR[ach.rarity]
    const msg = `${ach.icon} ${name} earned [${ach.code}] ${ach.name}`
    return {
      message: msg,
      parsedMessage: plain(msg),
      isReal: false,
      priority: 3,
      category: 'achievement',
      color
    }
  }

  // 7% point milestone
  if (s < 0.43) {
    const m = rand(DEMO_MILESTONES)
    const name = generateNickname()
    const msg = `💎 ${name} crossed 1 ${m.name}!`
    return {
      message: msg,
      parsedMessage: plain(msg),
      isReal: false,
      priority: 3,
      category: 'milestone',
      color: m.color
    }
  }

  // 7% win streak milestone
  if (s < 0.5) {
    const n = rand([3, 5, 8, 10] as const)
    const name = generateNickname()
    const inferno = n >= 5
    const msg = `${inferno ? '🔥' : '⚡'} ${name} hit ${n}-Win ${inferno ? 'Inferno' : 'Fever'} Streak!`
    const color = inferno ? '#f97316' : '#22c55e'
    return {
      message: msg,
      parsedMessage: plain(msg),
      isReal: false,
      priority: 3,
      category: 'streak',
      color
    }
  }

  // 7% - lap / prestige
  const lap = Math.floor(Math.random() * 25) + 1
  const name = generateNickname()
  const msg = `🔄 ${name} completed Lap ${lap}!`
  return {
    message: msg,
    parsedMessage: plain(msg),
    isReal: false,
    priority: 3,
    category: 'lap',
    color: '#6366f1'
  }
}

function buildFromBroadcast(
  b: ActivityBroadcast
): Omit<LiveEvent, 'id' | 'timestamp'> | null {
  const { type, nickname, payload } = b

  if (type === 'relic') {
    const relic = payload.relic as { name: string; rarity: RelicRarity } | null
    if (!relic) return null
    const color = RELIC_RARITY_COLOR[relic.rarity]
    const msg = `🧿 ${nickname} unearthed ${relic.rarity}: ${relic.name}!`
    return {
      message: msg,
      parsedMessage: plain(msg),
      isReal: true,
      priority: 0,
      category: 'relic',
      color
    }
  }

  if (type === 'achievement') {
    const { code, name: n, rarity, icon } = payload as {
      code: string
      name: string
      rarity: string
      icon: string
    }
    const color = ACH_RARITY_COLOR[rarity]
    const msg = `${icon} ${nickname} earned [${code}] ${n}!`
    return {
      message: msg,
      parsedMessage: plain(msg),
      isReal: true,
      priority: 0,
      category: 'achievement',
      color
    }
  }

  if (type === 'streak') {
    const streak = payload.streak as number
    const inferno = streak >= 5
    const msg = `${inferno ? '🔥' : '⚡'} ${nickname} hit ${streak}-Win ${inferno ? 'Inferno' : 'Fever'} Streak!`
    const color = inferno ? '#f97316' : '#22c55e'
    return {
      message: msg,
      parsedMessage: plain(msg),
      isReal: true,
      priority: 0,
      category: 'streak',
      color
    }
  }

  if (type === 'festival') {
    const festType = payload.festivalType as string
    const isDemo = payload.isDemo as boolean
    const color = FESTIVAL_COLOR[festType] ?? '#a855f7'
    const trigger = isDemo ? 'Oracle' : nickname
    const msg = `✨ ${trigger} triggered ${festType} Festival!`
    return {
      message: msg,
      parsedMessage: plain(msg),
      isReal: !isDemo,
      priority: isDemo ? 2 : 0,
      category: 'festival',
      color
    }
  }

  if (type === 'world_boss_hit') {
    const bossType = payload.bossType as string
    const dmgPct = payload.dmgPct as string
    const color = BOSS_TYPE_COLOR[bossType] ?? '#e879f9'
    const msg = `⚔️ ${nickname} hit ${bossType} for ${dmgPct} dmg`
    return {
      message: msg,
      parsedMessage: plain(msg),
      isReal: true,
      priority: 2,
      category: 'world_boss_hit' as EventCategory,
      color
    }
  }

  return null
}

export default function LiveActivityFeed() {
  const [visible, setVisible] = useState(true)
  const [active, setActive] = useState<(LiveEvent & { duration: number })[]>([])
  const [velocity, setVelocity] = useState(220)
  const lastEventRef = useRef<LiveEvent | null>(null)
  const pendingRef = useRef<LiveEvent[]>([])
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

  // Resize → recalculate scroll velocity
  useEffect(() => {
    const update = () => {
      setVelocity(Math.max(160, Math.min(window.innerWidth / 2, 400)))
      setActive([])
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Real prediction results (all users)
  useEffect(() => {
    if (!latestPredictionResult) return
    if (document.hidden) return
    const data = latestPredictionResult
    const isMe = data.userId === getUserId()
    const amount = BigInt(data.amount)
    // Suppress the minimal floor-bounce loss for current user
    if (isMe && data.result === 'LOSE' && amount === 50000n) return

    const name = data.nickname ?? 'Someone'
    const displayName = isMe ? 'You' : name
    const verb = data.result === 'WIN' ? 'won' : 'lost'
    const raw = `${displayName} ${verb} ${formatTickerPoints(amount)} points`

    pendingRef.current.unshift({
      id: crypto.randomUUID(),
      message: raw,
      parsedMessage: parseWithGem(raw),
      isReal: true,
      priority: isMe ? 1 : 2,
      category: 'prediction',
      timestamp: Date.now(),
      amount
    })
  }, [latestPredictionResult])

  // Drain broadcast events from the activityFeed bridge
  useEffect(() => {
    if (!visible) return
    const id = setInterval(() => {
      const events = drainActivities()
      for (const b of events) {
        const built = buildFromBroadcast(b)
        if (!built) continue
        pendingRef.current.unshift({
          ...built,
          id: b.id,
          timestamp: b.timestamp
        })
      }
    }, 400)
    return () => clearInterval(id)
  }, [visible])

  // Demo event generator
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    const schedule = () => {
      const mobile = window.innerWidth < 768
      const delay =
        mobile
          ? 2000 + Math.random() * 1000
          : 1000 + Math.random() * 1000
      t = setTimeout(() => {
        if (visible && !document.hidden && pendingRef.current.length < 10) {
          const demo = buildDemoEvent()
          pendingRef.current.push({
            ...demo,
            id: crypto.randomUUID(),
            timestamp: Date.now()
          })
        }
        schedule()
      }, delay)
    }
    schedule()
    return () => clearTimeout(t)
  }, [visible])

  // Display tick, dequeues one event at a time with timing control
  useEffect(() => {
    const cur = cleanupTimeoutsRef.current
    let timer: ReturnType<typeof setTimeout> | null = null

    const tick = () => {
      if (pendingRef.current.length === 0 || !visible || document.hidden) {
        timer = setTimeout(tick, 500)
        return
      }

      const now = Date.now()
      const mobile = window.innerWidth < 768
      const last = lastEventRef.current
      let minDelay = 650

      if (last) {
        minDelay =
          ((last.message.length * 8 + 60) / velocity) * 1000 +
          (mobile ? 1600 : 1000)
      }

      // High-priority real events skip most of the inter-event gap
      const hasHighPriority = pendingRef.current.some((e) => e.priority <= 1)
      const finalDelay = hasHighPriority
        ? Math.max(300, minDelay * 0.7)
        : minDelay

      if (now - lastStartTimeRef.current < finalDelay) {
        timer = setTimeout(tick, 300)
        return
      }

      // Sort: lowest priority number first, then oldest timestamp as tiebreaker
      pendingRef.current.sort(
        (a, b) => a.priority - b.priority || a.timestamp - b.timestamp
      )
      const next = pendingRef.current.shift()!

      lastEventRef.current = next
      const estimatedWidth = next.message.length * 8 + 50
      const totalDistance = window.innerWidth + estimatedWidth
      const duration = (totalDistance / velocity) * 1000

      lastStartTimeRef.current = now
      setActive((prev) => [...prev, { ...next, duration }].slice(-5))

      const rid = setTimeout(() => {
        setActive((prev) => prev.filter((e) => e.id !== next.id))
        cur.delete(rid)
      }, duration + 500)
      cur.add(rid)

      timer = setTimeout(tick, 400)
    }

    tick()
    return () => {
      if (timer) clearTimeout(timer)
      cur.forEach(clearTimeout)
      cur.clear()
    }
  }, [velocity, visible])

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="fixed bottom-2 right-3 text-[10px] font-bold px-3 py-1.5 bg-white border border-gray-200 rounded-full shadow-lg text-gray-400 hover:text-gray-600 z-50 uppercase"
      >
        Show Feed
      </button>
    )
  }

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
                <span
                  className="animate-pulse leading-none shrink-0"
                  style={{
                    color: event.priority === 0 ? '#f59e0b' : '#ef4444'
                  }}
                >
                  ●
                </span>
              )}
              <span
                className={
                  event.amount
                    ? `inline-flex items-center gap-0 ${getAmountColor(event.amount)}`
                    : 'inline-flex items-center gap-0'
                }
                style={
                  !event.amount && event.color
                    ? { color: event.color }
                    : undefined
                }
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