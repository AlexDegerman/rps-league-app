'use client'

import React, { useEffect, useState } from 'react'

const BEAMS = [
  { left: '35%', w: 35, blur: 9, delay: 0.0, dur: 1.0 },
  { left: '50%', w: 60, blur: 14, delay: 0.0, dur: 1.0 },
  { left: '65%', w: 30, blur: 8, delay: 0.03, dur: 1.0 }
]

// Plasma particles
const SPARKS = Array.from({ length: 400 }, (_, i) => {
  const angle = (i / 400) * Math.PI * 2
  const speed = 600 + (i % 10) * 140
  return {
    id: i,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 150,
    size: 4 + (i % 6),
    delay: 1.0 + (i % 6) * 0.012,
    dur: 1.45,
    color: [
      '#fef3c7',
      '#fbbf24',
      '#f59e0b',
      '#ef4444',
      '#ffffff',
      '#fb923c',
      '#fde68a',
      '#fcd34d'
    ][i % 8],
    glow: [
      'rgba(251,191,36,0.95)',
      'rgba(245,158,11,0.92)',
      'rgba(239,68,68,0.9)',
      'rgba(253,230,138,0.95)'
    ][i % 4]
  }
})

const CORONA_RINGS = [
  { size: 100, delay: 1.02, dur: 0.7 },
  { size: 200, delay: 1.06, dur: 0.85 },
  { size: 340, delay: 1.1, dur: 1.0 },
  { size: 520, delay: 1.15, dur: 1.1 },
  { size: 720, delay: 1.2, dur: 1.0 }
]

const SHOCKWAVES = [
  { size: 120, delay: 1.02, dur: 0.55 },
  { size: 260, delay: 1.04, dur: 0.7 },
  { size: 480, delay: 1.06, dur: 0.85 }
]

const CINDERS = Array.from({ length: 70 }, (_, i) => {
  const angle = (i / 70) * Math.PI * 2
  const speed = 70 + (i % 7) * 30
  return {
    id: i,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 50,
    size: 2 + (i % 4),
    delay: 1.05 + (i % 8) * 0.02,
    dur: 1.45
  }
})

export default function SolarFlareConfetti() {
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
  const activeSparks = isMobile ? SPARKS.slice(0, 100) : SPARKS
  const activeCinders = isMobile ? CINDERS.slice(0, 20) : CINDERS
  const activeCorona = isMobile ? CORONA_RINGS.slice(0, 2) : CORONA_RINGS

  return (
    <div
      className="absolute inset-x-0 pointer-events-none z-50 overflow-hidden rounded-xl"
      style={{ top: '-340px', height: '680px' }}
    >
      <div
        className="absolute overflow-hidden"
        style={{ top: 0, left: 0, right: 0, height: '80%' }}
      >
        {BEAMS.map((b, i) => (
          <React.Fragment key={i}>
            <div
              className="absolute"
              style={
                {
                  top: 0,
                  left: b.left,
                  width: `${b.w * 2.2}px`,
                  height: '0',
                  transform: 'translateX(-50%)',
                  background:
                    'linear-gradient(to bottom, rgba(253,230,138,0.45), rgba(245,158,11,0.6), rgba(245,158,11,0.35), transparent)',
                  filter: isMobile ? undefined : `blur(${b.blur * 1.5}px)`,
                  animation: `solar-beam-down ${b.dur}s ease-in ${b.delay}s both`,
                  willChange: 'transform, opacity'
                } as React.CSSProperties
              }
            />
            <div
              className="absolute"
              style={
                {
                  top: 0,
                  left: b.left,
                  width: `${b.w}px`,
                  height: '0',
                  transform: 'translateX(-50%)',
                  background:
                    'linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(253,230,138,0.9), rgba(245,158,11,0.7), rgba(239,68,68,0.3), transparent)',
                  filter: isMobile ? undefined : `blur(${b.blur}px)`,
                  animation: `solar-beam-down ${b.dur}s ease-in ${b.delay}s both`,
                  willChange: 'transform, opacity'
                } as React.CSSProperties
              }
            />
            <div
              className="absolute"
              style={
                {
                  top: 0,
                  left: b.left,
                  width: '2px',
                  height: '0',
                  transform: 'translateX(-50%)',
                  background:
                    'linear-gradient(to bottom, rgba(255,255,255,1), rgba(255,255,255,0.6), transparent)',
                  filter: isMobile ? undefined : 'blur(0.5px)',
                  animation: `solar-beam-down ${b.dur * 0.95}s ease-in ${b.delay}s both`,
                  willChange: 'transform, opacity'
                } as React.CSSProperties
              }
            />
          </React.Fragment>
        ))}
      </div>

      {/* Explosion container */}
      <div
        className="absolute inset-0"
        style={{
          animation: 'solar-explosion-reveal 1.0s step-end both'
        }}
      >
        {/* Thermonuclear Core Flash */}
        <div
          className="absolute rounded-full"
          style={{
            width: '180px',
            height: '180px',
            left: '50%',
            top: '80%',
            transform: 'translate(-50%, -50%)',
            background:
              'radial-gradient(circle, #ffffff 0%, #fbbf24 35%, #f97316 70%, transparent 100%)',
            filter: isMobile ? undefined : 'blur(8px)',
            opacity: 0,
            animation:
              'solar-supernova-flash 1.4s cubic-bezier(0.1, 0.8, 0.3, 1) 1.0s both',
            willChange: 'transform, opacity'
          }}
        />

        {/* Corona rings */}
        {activeCorona.map((r, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${r.size}px`,
              height: `${r.size}px`,
              left: '50%',
              top: '80%',
              border: `4px solid transparent`,
              background:
                'radial-gradient(circle, transparent 40%, #fbbf24 75%, #ef4444 100%)',
              boxShadow: isMobile
                ? undefined
                : `0 0 50px rgba(245,158,11,0.6), inset 0 0 30px rgba(239,68,68,0.4)`,
              opacity: 0,
              animation: `solar-corona-ring ${r.dur}s ease-out ${r.delay}s both`,
              willChange: 'transform, opacity'
            }}
          />
        ))}

        {/* Shockwave flat rings */}
        {SHOCKWAVES.map((r, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              width: `${r.size}px`,
              height: `${r.size * 0.18}px`,
              left: '50%',
              top: '80%',
              background:
                'radial-gradient(ellipse, transparent 30%, #fde68a 70%, #f59e0b 100%)',
              borderRadius: '50%',
              boxShadow: isMobile ? undefined : `0 0 45px rgba(245,158,11,0.7)`,
              opacity: 0,
              animation: `solar-corona-ring ${r.dur}s ease-out ${r.delay}s both`,
              willChange: 'transform, opacity'
            }}
          />
        ))}

        {/* Sparks */}
        {activeSparks.map((s) => (
          <div
            key={s.id}
            className="absolute rounded-full"
            style={
              {
                width: `${s.size}px`,
                height: `${s.size}px`,
                left: '50%',
                top: '80%',
                background: s.color,
                boxShadow: isMobile
                  ? undefined
                  : `0 0 ${s.size * 5}px ${s.glow}, 0 0 ${s.size * 10}px #ef4444`,
                opacity: 0,
                animation: `solar-spark-omnidirectional ${s.dur}s ease-out ${s.delay}s both`,
                willChange: 'transform, opacity',
                '--vx': `${s.vx}px`,
                '--vy': `${s.vy}px`
              } as React.CSSProperties
            }
          />
        ))}

        {/* Cinders */}
        {activeCinders.map((c) => (
          <div
            key={c.id}
            className="absolute rounded-full"
            style={
              {
                width: `${c.size}px`,
                height: `${c.size}px`,
                left: '50%',
                top: '80%',
                background: '#f97316',
                boxShadow: isMobile ? undefined : '0 0 8px #ef4444',
                opacity: 0,
                animation: `solar-cinder-rise ${c.dur}s ease-out ${c.delay}s both`,
                willChange: 'transform, opacity',
                '--vx': `${c.vx}px`,
                '--vy': `${c.vy}px`
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Flash white-out at boom */}
      <div
        className="absolute inset-0 rounded-xl"
        style={{
          background: 'rgba(255,255,255,1)',
          opacity: 0,
          animation: 'solar-thermal-flicker 0.65s ease-out 1.0s both'
        }}
      />
    </div>
  )
}
