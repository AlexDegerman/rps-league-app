'use client'

import { useEffect, useState, useRef } from 'react'
import React from 'react'
import type { EventTheme } from '@/types/rps'

// Electric full-screen
function ElectricActivationConfetti({ isMobile }: { isMobile: boolean }) {
  const boltCount = isMobile ? 20 : 40
  const haloCount = isMobile ? 4 : 8
  const sparkCount = isMobile ? 40 : 80

  return (
    <div className="fixed inset-0 pointer-events-none z-200 overflow-hidden">
      {/* Bolt columns */}
      {Array.from({ length: boltCount }).map((_, i) => (
        <div
          key={i}
          className="absolute origin-top"
          style={
            {
              left: `${(i / (boltCount - 1)) * 98 + 1}%`,
              top: '-5%',
              width: `${2 + (i % 3)}px`,
              height: '110vh',
              transform: 'scaleY(0)',
              background: `linear-gradient(to bottom, rgba(255,255,255,1), #e9d5ff, #b794f4, #9f7aea, rgba(127,156,245,0.3), transparent)`,
              boxShadow: isMobile
                ? undefined
                : `0 0 10px #b794f4, 0 0 22px rgba(159,122,234,0.9), 0 0 40px rgba(127,156,245,0.6)`,
              animation: `electric-bolt-fall-fs ${0.6 + (i % 3) * 0.1}s ease-in ${(i % 4) * 0.04}s both`
            } as React.CSSProperties
          }
        />
      ))}
      {/* Halos */}
      {Array.from({ length: haloCount }).map((_, i) => (
        <div
          key={`h${i}`}
          className="absolute origin-top"
          style={
            {
              left: `${(i / (haloCount - 1)) * 90 + 5}%`,
              top: '-5%',
              width: `${20 + (i % 3) * 10}px`,
              height: '110vh',
              transform: 'scaleY(0)',
              background: `linear-gradient(to bottom, rgba(183,148,244,0.2), rgba(159,122,234,0.3), transparent)`,
              filter: isMobile ? undefined : 'blur(6px)',
              animation: `electric-bolt-fall-fs 0.75s ease-in 0s forwards`
            } as React.CSSProperties
          }
        />
      ))}
      {/* Sparks */}
      {Array.from({ length: sparkCount }).map((_, i) => (
        <div
          key={`s${i}`}
          className="absolute rounded-full"
          style={
            {
              width: `${2 + (i % 4)}px`,
              height: `${2 + (i % 4)}px`,
              left: `${(i * 13 + 5) % 100}%`,
              top: `${(i * 7 + 3) % 20}%`,
              background: [
                '#e9d5ff',
                '#b794f4',
                '#9f7aea',
                '#ffffff',
                '#7f9cf5'
              ][i % 5],
              boxShadow: isMobile
                ? undefined
                : `0 0 8px #b794f4, 0 0 16px rgba(159,122,234,0.6)`,
              animation: `confetti-burst 0.9s ease-out ${(i % 6) * 0.04}s forwards`,
              '--vx': `${((i * 37 + 15) % 200) - 100}px`,
              '--vy': `${80 + ((i * 23 + 9) % 160)}px`
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}

// Cards full-screen
const SUITS = ['♠', '♥', '♣', '♦']
const SUIT_COLORS = ['#1a202c', '#c53030', '#1a202c', '#c53030']
const RANKS = ['A', 'K', 'Q', 'J', '10']

function CardsActivationConfetti({ isMobile }: { isMobile: boolean }) {
  const burstCount = isMobile ? 20 : 40
  const symbolCount = isMobile ? 20 : 40
  const rectCount = isMobile ? 15 : 30

  return (
    <div className="fixed inset-0 pointer-events-none z-200 overflow-hidden">
      {/* Gold/silver particle burst from top */}
      {Array.from({ length: burstCount }).map((_, i) => {
        const isGold = i % 2 === 0
        const size = 3 + (i % 4)
        return (
          <div
            key={`p${i}`}
            className="absolute rounded-full pointer-events-none"
            style={
              {
                width: `${size}px`,
                height: `${size}px`,
                left: `${40 + ((i * 31 + 7) % 20)}%`,
                top: '0%',
                background: isGold ? '#ecc94b' : '#e8e8e8',
                boxShadow: isMobile
                  ? undefined
                  : `0 0 ${size * 2}px ${isGold ? '#ecc94b' : '#c0c0c0'}`,
                animation: `card-particle-burst ${0.8 + (i % 5) * 0.1}s cubic-bezier(0.25,0.46,0.45,0.94) ${i * 0.025}s both`,
                '--vx': `${((i * 41 + 13) % 300) - 150}px`,
                '--vy': `${Math.min(120 + ((i * 23 + 7) % 200) + 300, 900)}px`
              } as React.CSSProperties
            }
          />
        )
      })}
      {/* Large suit symbols */}
      {Array.from({ length: symbolCount }).map((_, i) => {
        const size = 12 + (i % 5) * 9
        return (
          <div
            key={i}
            className="absolute pointer-events-none font-black select-none"
            style={
              {
                left: `${1 + (i % 14) * 7.2}%`,
                top: `${-8 - (i % 5) * 4}%`,
                fontSize: `${size}px`,
                color: SUIT_COLORS[i % 4],
                textShadow: isMobile
                  ? undefined
                  : `0 0 16px ${i % 2 === 0 ? 'rgba(236,201,75,0.95)' : 'rgba(192,192,192,0.85)'}, 0 0 30px ${i % 2 === 0 ? 'rgba(236,201,75,0.4)' : 'rgba(192,192,192,0.3)'}`,
                filter: isMobile
                  ? undefined
                  : `drop-shadow(0 0 6px ${i % 2 === 0 ? 'rgba(236,201,75,0.6)' : 'rgba(192,192,192,0.5)'})`,
                // Slightly faster than original (1.0s vs 1.2-1.4s), vy capped at 900px
                animation: `card-cascade-fall ${1.0 + (i % 6) * 0.05}s cubic-bezier(0.25,0.46,0.45,0.94) ${i * 0.04}s both`,
                '--vx': `${((i * 31 + 9) % 100) - 50}px`,
                '--vy': `${Math.min(450 + ((i * 17 + 5) % 200) + 200, 900)}px`
              } as React.CSSProperties
            }
          >
            {SUITS[i % 4]}
          </div>
        )
      })}
      {/* Mini card rectangles */}
      {Array.from({ length: rectCount }).map((_, i) => {
        const isGold = i % 3 === 0
        const isSilv = i % 3 === 1
        const bg = isGold
          ? 'linear-gradient(135deg, #ecc94b, #f6e05e)'
          : isSilv
            ? 'linear-gradient(135deg, #c0c0c0, #e8e8e8)'
            : 'white'
        const rankColor = isGold ? '#92400e' : isSilv ? '#374151' : '#c53030'
        return (
          <div
            key={`c${i}`}
            className="absolute rounded-sm pointer-events-none flex items-center justify-center"
            style={
              {
                width: '14px',
                height: '20px',
                left: `${3 + (i % 12) * 8.5}%`,
                top: `${-10 - (i % 4) * 4}%`,
                background: bg,
                border: '1px solid rgba(0,0,0,0.12)',
                boxShadow: isMobile
                  ? undefined
                  : `0 2px 6px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.5)`,
                fontSize: '6px',
                fontWeight: 800,
                color: rankColor,
                lineHeight: 1,
                animation: `card-cascade-fall ${1.0 + (i % 6) * 0.05}s cubic-bezier(0.25,0.46,0.45,0.94) ${i * 0.055}s both`,
                '--vx': `${((i * 23 + 7) % 80) - 40}px`,
                '--vy': `${Math.min(420 + ((i * 13 + 11) % 180) + 200, 900)}px`
              } as React.CSSProperties
            }
          >
            {RANKS[i % 5]}
          </div>
        )
      })}
    </div>
  )
}

// Lunar full-screen
const LUNAR_FS_SHAFTS = [
  { left: '10%', w: 18, blur: 5, aC: 0.55, aG: 0.25, delay: 0.1, dur: 1.3 },
  { left: '18%', w: 40, blur: 12, aC: 0.6, aG: 0.3, delay: 0.05, dur: 1.4 },
  { left: '27%', w: 28, blur: 8, aC: 0.65, aG: 0.32, delay: 0.03, dur: 1.3 },
  { left: '35%', w: 70, blur: 16, aC: 0.7, aG: 0.38, delay: 0.02, dur: 1.5 },
  { left: '42%', w: 45, blur: 12, aC: 0.75, aG: 0.4, delay: 0.01, dur: 1.4 },
  { left: '50%', w: 110, blur: 22, aC: 0.85, aG: 0.5, delay: 0.0, dur: 1.6 },
  { left: '58%', w: 45, blur: 12, aC: 0.75, aG: 0.4, delay: 0.01, dur: 1.4 },
  { left: '65%', w: 70, blur: 16, aC: 0.7, aG: 0.38, delay: 0.02, dur: 1.5 },
  { left: '73%', w: 28, blur: 8, aC: 0.65, aG: 0.32, delay: 0.03, dur: 1.3 },
  { left: '82%', w: 40, blur: 12, aC: 0.6, aG: 0.3, delay: 0.05, dur: 1.4 },
  { left: '90%', w: 18, blur: 5, aC: 0.55, aG: 0.25, delay: 0.1, dur: 1.3 }
]

function LunarActivationConfetti({ isMobile }: { isMobile: boolean }) {
  const activeShafts = isMobile
    ? LUNAR_FS_SHAFTS.filter((_, i) => i % 2 === 0)
    : LUNAR_FS_SHAFTS
  const moteCount = isMobile ? 40 : 80

  return (
    <div className="fixed inset-0 pointer-events-none z-200 overflow-hidden">
      {/* Moon source bloom */}
      <div
        className="absolute"
        style={{
          width: '400px',
          height: '200px',
          top: '-60px',
          left: '50%',
          transform: 'translateX(-50%)',
          background:
            'radial-gradient(ellipse, rgba(220,240,255,0.9) 0%, rgba(180,220,255,0.6) 35%, rgba(144,205,244,0.2) 65%, transparent 80%)',
          animation: 'lunar-bloom 2s ease-out 0.05s both'
        }}
      />
      <div
        className="absolute"
        style={{
          width: '160px',
          height: '100px',
          top: '-25px',
          left: '50%',
          transform: 'translateX(-50%)',
          background:
            'radial-gradient(ellipse, rgba(255,255,255,1) 0%, rgba(220,240,255,0.8) 50%, transparent 75%)',
          animation: 'lunar-bloom 2s ease-out 0.1s both'
        }}
      />
      {/* Shafts */}
      {activeShafts.flatMap((d, i) => [
        <div
          key={`h${i}`}
          className="absolute origin-top"
          style={
            {
              top: '-5%',
              left: d.left,
              width: `${d.w * 2.5}px`,
              height: '110vh',
              transform: 'translateX(-50%) scaleY(0)',
              background: `linear-gradient(to bottom, rgba(180,220,255,${d.aG * 0.5}), rgba(144,205,244,${d.aG}), rgba(144,205,244,${d.aG * 0.5}), transparent)`,
              filter: isMobile ? undefined : `blur(${d.blur * 1.8}px)`,
              animation: `lunar-shaft-fall-fs ${d.dur}s ease-out ${d.delay}s both`
            } as React.CSSProperties
          }
        />,
        <div
          key={`c${i}`}
          className="absolute origin-top"
          style={
            {
              top: '-5%',
              left: d.left,
              width: `${d.w}px`,
              height: '110vh',
              transform: 'translateX(-50%) scaleY(0)',
              background: `linear-gradient(to bottom, rgba(255,255,255,${d.aC}), rgba(210,235,255,${d.aC * 0.9}), rgba(180,220,255,${d.aC * 0.7}), rgba(144,205,244,${d.aC * 0.4}), transparent)`,
              filter: isMobile ? undefined : `blur(${d.blur}px)`,
              animation: `lunar-shaft-fall-fs ${d.dur}s ease-out ${d.delay}s both`
            } as React.CSSProperties
          }
        />,
        ...(d.w >= 40 && !isMobile
          ? [
              <div
                key={`s${i}`}
                className="absolute origin-top"
                style={
                  {
                    top: '-5%',
                    left: d.left,
                    width: `${Math.max(2, Math.round(d.w * 0.08))}px`,
                    height: '110vh',
                    transform: 'translateX(-50%) scaleY(0)',
                    background:
                      'linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(255,255,255,0.7), rgba(220,240,255,0.3), transparent)',
                    filter: 'blur(1px)',
                    animation: `lunar-shaft-fall-fs ${d.dur}s ease-out ${d.delay}s both`
                  } as React.CSSProperties
                }
              />
            ]
          : [])
      ])}
      {/* Drifting motes */}
      {Array.from({ length: moteCount }).map((_, i) => (
        <div
          key={`m${i}`}
          className="absolute rounded-full"
          style={
            {
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              left: `${((i * 97 + 13) % 96) + 2}%`,
              top: `${(i * 61 + 7) % 85}%`,
              background: [
                'rgba(255,255,255,1)',
                'rgba(220,240,255,1)',
                'rgba(180,220,255,0.95)',
                'rgba(144,205,244,0.9)'
              ][i % 4],
              boxShadow: isMobile
                ? undefined
                : `0 0 ${5 + (i % 3) * 3}px rgba(180,220,255,1), 0 0 ${10 + (i % 3) * 4}px rgba(144,205,244,0.8)`,
              animation: `lunar-mote-drift ${1.6 + (i % 5) * 0.15}s ease-in-out ${(i % 9) * 0.06}s both`,
              '--dx': `${((i * 41 + 13) % 70) - 35}px`,
              opacity: 0
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}

// Hellfire full-screen
function HellfireActivationConfetti({ isMobile }: { isMobile: boolean }) {
  const flameCount = isMobile ? 50 : 100
  const emberCount = isMobile ? 30 : 60

  return (
    <div className="fixed inset-0 pointer-events-none z-200 overflow-hidden">
      {/* Screen flash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 100%, #ef444466, transparent 70%)',
          animation: 'hellfire-screen-flash 1.0s ease-out forwards'
        }}
      />
      {/* Ground glow */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: '36px',
          background:
            'linear-gradient(to top, #dc2626cc, #ef444433, transparent)',
          animation: 'hellfire-glow-pulse 0.9s ease-in-out infinite'
        }}
      />
      {/* Flame columns */}
      {Array.from({ length: flameCount }).map((_, i) => {
        const tier = i % 3
        const size = [6, 11, 18][tier]!
        const colors = [
          ['#ef4444', '#f97316'],
          ['#dc2626', '#fbbf24'],
          ['#b91c1c', '#fb923c'],
          ['#7f1d1d', '#ef4444'],
          ['#991b1b', '#f97316'],
          ['#fbbf24', '#ef4444']
        ]
        const [c1, c2] = colors[i % 6]!
        const col = (i % 18) * 5.7
        const vyBase = -(150 + (i % 5) * 50)
        const vyFull = -(250 + (i % 7) * 70)
        const sx = 0.7 + (i % 4) * 0.2
        const delay = (i % 12) * 0.04
        const dur = 0.6 + (i % 5) * 0.1
        return (
          <div
            key={i}
            className="absolute pointer-events-none"
            style={
              {
                width: `${size}px`,
                height: `${size * 1.8}px`,
                left: `${col + (i % 3) * 1.2}%`,
                bottom: `${2 + (i % 4) * 3}%`,
                background: `radial-gradient(ellipse at 50% 85%, ${c1}, ${c2}99, transparent)`,
                borderRadius: '50% 50% 25% 25%',
                filter: isMobile ? undefined : `blur(${[0.5, 1, 1.8][tier]}px)`,
                animation: `hellfire-rise ${dur}s ease-out ${delay}s infinite`,
                '--vy': `${vyBase}px`,
                '--vy-full': `${vyFull}px`,
                '--sx': sx
              } as React.CSSProperties
            }
          />
        )
      })}
      {/* Embers */}
      {Array.from({ length: emberCount }).map((_, i) => {
        const size = 2 + (i % 4)
        return (
          <div
            key={`e${i}`}
            className="absolute rounded-full pointer-events-none"
            style={
              {
                width: `${size}px`,
                height: `${size}px`,
                left: `${5 + (i % 14) * 7}%`,
                bottom: `${5 + (i % 5) * 6}%`,
                background:
                  i % 3 === 0 ? '#fbbf24' : i % 3 === 1 ? '#fb923c' : '#ef4444',
                boxShadow: isMobile
                  ? undefined
                  : `0 0 ${size * 2}px ${i % 2 === 0 ? '#fbbf24' : '#ef4444'}`,
                animation: `hellfire-ember ${0.5 + (i % 6) * 0.12}s ease-out ${(i % 10) * 0.05}s infinite`,
                '--vx': `${((i * 37 + 11) % 160) - 80}px`,
                '--vy': `${-(100 + ((i * 23 + 7) % 150))}px`
              } as React.CSSProperties
            }
          />
        )
      })}
    </div>
  )
}

const EVENT_CONFIG: Record<
  string,
  {
    name: string
    textClass: string
    tintColor: string
    totalMs: number
    revealDelayMs: number
    fadeStartMs: number
  }
> = {
  LUNAR: {
    name: "Moon's Blessing",
    textClass: 'g-dvg',
    tintColor: 'rgba(144,205,244,0.12)',
    totalMs: 2400,
    revealDelayMs: 80,
    fadeStartMs: 1800
  },
  ELECTRIC: {
    name: 'Electric Surge',
    textClass: 'g-tvg',
    tintColor: 'rgba(159,122,234,0.12)',
    totalMs: 2200,
    revealDelayMs: 80,
    fadeStartMs: 1600
  },
  CARDS: {
    name: 'Luck in the Cards',
    textClass: 'g-qiv',
    tintColor: 'rgba(236,201,75,0.10)',
    totalMs: 2400,
    revealDelayMs: 80,
    fadeStartMs: 1800
  },
  HELLFIRE: {
    name: 'Hellfire',
    textClass: 'g-spv',
    tintColor: 'rgba(220,38,38,0.12)',
    totalMs: 2200,
    revealDelayMs: 80,
    fadeStartMs: 1600
  }
}

// Main overlay
interface FlashEventActivationOverlayProps {
  event: EventTheme
  onDone: () => void
}

type Phase = 'burst' | 'reveal' | 'fade' | 'done'

export default function FlashEventActivationOverlay({
  event,
  onDone
}: FlashEventActivationOverlayProps) {
  const config = event ? EVENT_CONFIG[event] : null

  const [prevEvent, setPrevEvent] = useState<EventTheme | null>(null)
  const [phase, setPhase] = useState<Phase>('burst')

  if (event !== prevEvent) {
    setPhase('burst')
    setPrevEvent(event)
  }

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    let active = true
    requestAnimationFrame(() => {
      if (active) {
        setIsMobile(window.innerWidth < 768)
      }
    })
    return () => {
      active = false
    }
  }, [event])

  useEffect(() => {
    if (!config) {
      onDone()
      return
    }

    const push = (fn: () => void, ms: number) => {
      const t = setTimeout(fn, ms)
      timersRef.current.push(t)
    }

    push(() => setPhase('reveal'), config.revealDelayMs)
    push(() => setPhase('fade'), config.fadeStartMs)
    push(() => {
      setPhase('done')
      onDone()
    }, config.totalMs)

    return () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event])

  if (!config || phase === 'done') return null

  const textVisible = phase === 'reveal' || phase === 'fade'
  const containerFading = phase === 'fade'

  return (
    <>
      {/* Full-screen tint */}
      <div
        className="fixed inset-0 pointer-events-none z-198"
        style={{
          background: config.tintColor,
          opacity: containerFading ? 0 : 1,
          transition: containerFading ? 'opacity 500ms ease-out' : 'none'
        }}
      />

      {/* Confetti layer */}
      <div
        style={{
          opacity: containerFading ? 0 : 1,
          transition: containerFading ? 'opacity 400ms ease-out' : 'none'
        }}
      >
        {event === 'LUNAR' && <LunarActivationConfetti isMobile={isMobile} />}
        {event === 'ELECTRIC' && (
          <ElectricActivationConfetti isMobile={isMobile} />
        )}
        {event === 'CARDS' && <CardsActivationConfetti isMobile={isMobile} />}
        {event === 'HELLFIRE' && (
          <HellfireActivationConfetti isMobile={isMobile} />
        )}
      </div>

      {/* Event name text */}
      <div
        className="fixed inset-0 pointer-events-none z-201 flex flex-col items-center justify-start pt-[20vh]"
        style={{
          opacity: textVisible ? 1 : 0,
          transform: textVisible
            ? 'scale(1) translateY(0)'
            : 'scale(0.85) translateY(-12px)',
          transition: textVisible
            ? 'opacity 180ms ease-out, transform 220ms cubic-bezier(0.22,1,0.36,1)'
            : 'opacity 400ms ease-out, transform 400ms ease-in'
        }}
      >
        <div className="flex flex-col items-center gap-3 select-none">
          {/* Eyebrow */}
          <span
            className="text-[10px] font-black uppercase tracking-[0.35em] px-4 py-1 rounded-full border"
            style={{
              color:
                event === 'LUNAR'
                  ? '#90cdf4'
                  : event === 'ELECTRIC'
                    ? '#b794f4'
                    : event === 'CARDS'
                      ? '#ecc94b'
                      : '#fb923c',
              borderColor:
                event === 'LUNAR'
                  ? 'rgba(144,205,244,0.4)'
                  : event === 'ELECTRIC'
                    ? 'rgba(183,148,244,0.4)'
                    : event === 'CARDS'
                      ? 'rgba(236,201,75,0.4)'
                      : 'rgba(251,146,60,0.4)',
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(8px)'
            }}
          >
            FLASH EVENT
          </span>

          {/* Main name */}
          <span
            className={`${config.textClass} font-black text-5xl sm:text-7xl uppercase tracking-tight leading-none text-center`}
          >
            {config.name}
          </span>

          {/* Sub-label */}
          <span
            className="text-white/70 text-sm sm:text-base font-black uppercase tracking-[0.3em]"
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}
          >
            ACTIVATED
          </span>
        </div>
      </div>
    </>
  )
}