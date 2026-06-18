'use client'

import React, { useEffect, useState } from 'react'

const SUITS = ['♠', '♥', '♣', '♦']
const SUIT_COLORS = ['#1a202c', '#c53030', '#1a202c', '#c53030']
const RANKS = ['A', 'K', 'Q', 'J', '10']

export default function CardsConfetti() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    let active = true
    requestAnimationFrame(() => {
      if (active) {
        setMounted(true)
      }
    })
    return () => {
      active = false
    }
  }, [])

  if (!mounted) return null

  const isMobile = window.innerWidth < 768
  const burstCount = isMobile ? 20 : 40
  const symbolCount = isMobile ? 20 : 40
  const rectCount = isMobile ? 15 : 30
  const trailCount = isMobile ? 10 : 16

  return (
    <div
      className="absolute inset-x-0 pointer-events-none z-50 overflow-hidden rounded-xl"
      style={{ top: '-20px', height: '600px' }}
    >
      {/* Gold/silver particle burst from center-top */}
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
                '--vy': `${120 + ((i * 23 + 7) % 200)}px`
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
                animation: `card-cascade-fall ${1.4 + (i % 6) * 0.1}s cubic-bezier(0.25,0.46,0.45,0.94) ${i * 0.04}s both`,
                '--vx': `${((i * 31 + 9) % 100) - 50}px`,
                '--vy': `${450 + ((i * 17 + 5) % 200)}px`
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
                animation: `card-cascade-fall ${1.2 + (i % 6) * 0.1}s cubic-bezier(0.25,0.46,0.45,0.94) ${i * 0.055}s both`,
                '--vx': `${((i * 23 + 7) % 80) - 40}px`,
                '--vy': `${420 + ((i * 13 + 11) % 180)}px`
              } as React.CSSProperties
            }
          >
            {RANKS[i % 5]}
          </div>
        )
      })}

      {/* Shimmer trails */}
      {Array.from({ length: trailCount }).map((_, i) => (
        <div
          key={`t${i}`}
          className="absolute pointer-events-none origin-top"
          style={
            {
              width: '1px',
              height: `${20 + (i % 4) * 12}px`,
              left: `${6 + i * 6.2}%`,
              top: `${-5 - (i % 3) * 3}%`,
              background: `linear-gradient(to bottom, ${i % 2 === 0 ? 'rgba(236,201,75,0.7)' : 'rgba(192,192,192,0.6)'}, transparent)`,
              animation: `card-shimmer-trail ${1.6 + (i % 4) * 0.1}s ease-out ${i * 0.05}s forwards`
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}
