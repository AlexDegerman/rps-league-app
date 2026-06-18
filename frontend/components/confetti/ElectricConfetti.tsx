'use client'

import React, { useEffect, useState } from 'react'

export default function ElectricConfetti() {
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
  const boltCount = isMobile ? 20 : 40
  const haloCount = isMobile ? 5 : 8
  const sparkCount = isMobile ? 40 : 80

  return (
    <div
      className="absolute inset-x-0 pointer-events-none z-50 overflow-hidden rounded-xl"
      style={{ top: '-20px', height: '600px' }}
    >
      {/* Bolt columns */}
      {Array.from({ length: boltCount }).map((_, i) => (
        <div
          key={i}
          className="absolute"
          style={
            {
              left: `${(i / (boltCount - 1)) * 98 + 1}%`,
              top: '-5%',
              width: `${2 + (i % 3)}px`,
              height: '0',
              background: `linear-gradient(to bottom, rgba(255,255,255,1), #e9d5ff, #b794f4, #9f7aea, rgba(127,156,245,0.3), transparent)`,
              boxShadow: isMobile
                ? undefined
                : `0 0 10px #b794f4, 0 0 22px rgba(159,122,234,0.9), 0 0 40px rgba(127,156,245,0.6)`,
              animation: `electric-bolt-fall ${0.6 + (i % 3) * 0.1}s ease-in ${(i % 4) * 0.04}s both`
            } as React.CSSProperties
          }
        />
      ))}

      {/* Halos */}
      {Array.from({ length: haloCount }).map((_, i) => (
        <div
          key={`h${i}`}
          className="absolute"
          style={
            {
              left: `${(i / (haloCount - 1)) * 90 + 5}%`,
              top: '-5%',
              width: `${20 + (i % 3) * 10}px`,
              height: '0',
              background: `linear-gradient(to bottom, rgba(183,148,244,0.2), rgba(159,122,234,0.3), transparent)`,
              filter: isMobile ? undefined : 'blur(6px)',
              animation: `electric-bolt-fall 0.75s ease-in 0s forwards`
            } as React.CSSProperties
          }
        />
      ))}

      {/* Spark scatter */}
      {Array.from({ length: sparkCount }).map((_, i) => (
        <div
          key={`s${i}`}
          className="absolute rounded-full"
          style={
            {
              width: `${2 + (i % 4)}px`,
              height: `${2 + (i % 4)}px`,
              left: `${(i * 13 + 5) % 100}%`,
              top: `${(i * 7 + 11) % 70}%`,
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
              animation: `confetti-burst 0.8s ease-out ${(i % 6) * 0.04}s forwards`
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}
