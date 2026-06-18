'use client'

import React, { useEffect, useState } from 'react'

// 80 droplets bursting from wave impact - spread across full width
const DROPLETS = Array.from({ length: 80 }, (_, i) => {
  const angle = (i / 80) * Math.PI * 2
  const speed = 120 + (i % 8) * 35
  return {
    id: i,
    startLeft: `${3 + (i % 19) * 5}%`,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 80,
    size: 3 + (i % 5),
    delay: 0.15 + (i % 7) * 0.025,
    dur: 1.6,
    color: [
      'rgba(34,211,238,0.95)',
      'rgba(103,232,249,0.9)',
      'rgba(207,250,254,0.98)',
      'rgba(255,255,255,0.95)',
      'rgba(6,182,212,0.9)'
    ][i % 5]
  }
})

const FOAM_CHUNKS = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  startLeft: `${2 + (i % 15) * 6.5}%`,
  vx: -20 + (i % 7) * 12,
  vy: -(60 + (i % 5) * 20),
  size: 6 + (i % 6) * 3,
  delay: 0.05 + (i % 5) * 0.02,
  dur: 1.2
}))

const MISTS = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  left: `${((i * 53 + 7) % 90) + 5}%`,
  top: `${5 + (i % 8) * 11}%`,
  size: 8 + (i % 8) * 5,
  delay: 0.9 + (i % 10) * 0.04,
  dur: 1.3
}))

export default function TidalSurgeConfetti() {
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
  const activeDroplets = isMobile ? DROPLETS.slice(0, 25) : DROPLETS
  const activeFoam = isMobile ? FOAM_CHUNKS.slice(0, 10) : FOAM_CHUNKS
  const activeMists = isMobile ? MISTS.slice(0, 15) : MISTS

  return (
    <div
      className="absolute inset-x-0 pointer-events-none z-50 overflow-hidden rounded-xl"
      style={{ top: '-340px', height: '680px' }}
    >
      {/* Main wave body, tall vertical wall covering full height */}
      <div
        className="absolute"
        style={{
          left: 0,
          top: 0,
          width: '130%',
          height: '100%',
          background:
            'linear-gradient(to right, transparent 0%, rgba(34,211,238,0.0) 5%, rgba(34,211,238,0.52) 28%, rgba(8,145,178,0.75) 50%, rgba(34,211,238,0.6) 70%, rgba(103,232,249,0.32) 88%, transparent 100%)',
          filter: isMobile ? undefined : 'blur(8px)',
          animation:
            'tidal-wave-slam 0.9s cubic-bezier(0.18,0.65,0.38,1) 0.0s both',
          willChange: 'transform, opacity'
        }}
      />
      {/* Deep teal underbody */}
      <div
        className="absolute"
        style={{
          left: 0,
          top: '8%',
          width: '125%',
          height: '85%',
          background:
            'linear-gradient(to right, transparent 0%, rgba(8,145,178,0.0) 8%, rgba(8,145,178,0.62) 35%, rgba(6,120,150,0.8) 55%, rgba(8,145,178,0.55) 72%, transparent 100%)',
          filter: isMobile ? undefined : 'blur(12px)',
          animation:
            'tidal-wave-slam 0.92s cubic-bezier(0.18,0.65,0.38,1) 0.025s both',
          willChange: 'transform, opacity'
        }}
      />
      {/* Mid wall shimmer */}
      <div
        className="absolute"
        style={{
          left: 0,
          top: '5%',
          width: '120%',
          height: '75%',
          background:
            'linear-gradient(to right, transparent 0%, rgba(103,232,249,0.0) 10%, rgba(103,232,249,0.42) 38%, rgba(34,211,238,0.58) 56%, rgba(103,232,249,0.35) 74%, transparent 100%)',
          filter: isMobile ? undefined : 'blur(5px)',
          animation:
            'tidal-wave-slam 0.88s cubic-bezier(0.2,0.62,0.36,1) 0.01s both',
          willChange: 'transform, opacity'
        }}
      />
      {/* Surface foam crest */}
      <div
        className="absolute"
        style={{
          left: 0,
          top: 0,
          width: '118%',
          height: '100%',
          background:
            'linear-gradient(to right, transparent 0%, rgba(255,255,255,0.0) 12%, rgba(255,255,255,0.9) 38%, rgba(207,250,254,0.96) 44%, rgba(255,255,255,0.82) 50%, transparent 58%)',
          filter: isMobile ? undefined : 'blur(2px)',
          animation:
            'tidal-foam-slam 0.85s cubic-bezier(0.15,0.58,0.32,1) 0.0s both',
          willChange: 'transform, opacity'
        }}
      />
      {/* Upper foam streak */}
      <div
        className="absolute"
        style={{
          left: 0,
          top: '2%',
          width: '115%',
          height: '18%',
          background:
            'linear-gradient(to right, transparent 5%, rgba(207,250,254,0.0) 15%, rgba(255,255,255,0.85) 40%, rgba(207,250,254,0.92) 48%, transparent 60%)',
          filter: isMobile ? undefined : 'blur(1.5px)',
          animation:
            'tidal-foam-slam 0.82s cubic-bezier(0.15,0.55,0.35,1) 0.0s both',
          willChange: 'transform, opacity'
        }}
      />
      {/* Lower foam streak */}
      <div
        className="absolute"
        style={{
          left: 0,
          top: '75%',
          width: '116%',
          height: '14%',
          background:
            'linear-gradient(to right, transparent 5%, rgba(207,250,254,0.0) 18%, rgba(207,250,254,0.72) 42%, rgba(255,255,255,0.68) 50%, transparent 62%)',
          filter: isMobile ? undefined : 'blur(2px)',
          animation:
            'tidal-foam-slam 0.86s cubic-bezier(0.15,0.55,0.35,1) 0.03s both',
          willChange: 'transform, opacity'
        }}
      />
      {/* Spray veil */}
      <div
        className="absolute"
        style={{
          left: 0,
          top: 0,
          width: '135%',
          height: '100%',
          background:
            'linear-gradient(to right, transparent 0%, rgba(207,250,254,0.0) 18%, rgba(207,250,254,0.2) 45%, rgba(207,250,254,0.16) 62%, transparent 100%)',
          filter: isMobile ? undefined : 'blur(18px)',
          animation:
            'tidal-wave-slam 1.05s cubic-bezier(0.18,0.65,0.38,1) 0.04s both',
          willChange: 'transform, opacity'
        }}
      />
      {activeFoam.map((c) => (
        <div
          key={c.id}
          className="absolute rounded-full"
          style={
            {
              width: `${c.size}px`,
              height: `${c.size * 0.7}px`,
              left: c.startLeft,
              top: `${10 + (c.id % 8) * 10}%`,
              background:
                'radial-gradient(ellipse, rgba(255,255,255,0.95) 0%, rgba(207,250,254,0.8) 60%, transparent 100%)',
              filter: isMobile ? undefined : 'blur(1px)',
              animation: `tidal-droplet-gravity ${c.dur}s ease-out ${c.delay}s both`,
              willChange: 'transform, opacity',
              '--vx': `${c.vx}px`,
              '--vy': `${c.vy}px`
            } as React.CSSProperties
          }
        />
      ))}
      {activeDroplets.map((d) => (
        <div
          key={d.id}
          className="absolute rounded-full"
          style={
            {
              width: `${d.size}px`,
              height: `${d.size * 1.6}px`,
              left: d.startLeft,
              top: `${5 + (d.id % 9) * 10}%`,
              background: d.color,
              boxShadow: isMobile
                ? undefined
                : `0 0 ${d.size * 2.5}px rgba(34,211,238,0.7)`,
              animation: `tidal-droplet-gravity ${d.dur}s ease-in ${d.delay}s both`,
              willChange: 'transform, opacity',
              '--vx': `${d.vx}px`,
              '--vy': `${d.vy}px`
            } as React.CSSProperties
          }
        />
      ))}
      <div
        className="absolute inset-0 rounded-xl"
        style={{
          background:
            'linear-gradient(to bottom, rgba(34,211,238,0.1), rgba(8,145,178,0.06))',
          animation: 'tidal-submersion 3.0s ease-out 0.0s both'
        }}
      />
      {activeMists.map((m) => (
        <div
          key={m.id}
          className="absolute rounded-full"
          style={{
            width: `${m.size}px`,
            height: `${m.size}px`,
            left: m.left,
            top: m.top,
            background: 'rgba(207,250,254,0.38)',
            filter: isMobile ? undefined : 'blur(4px)',
            animation: `tidal-mist-fade ${m.dur}s ease-out ${m.delay}s both`
          }}
        />
      ))}
    </div>
  )
}
