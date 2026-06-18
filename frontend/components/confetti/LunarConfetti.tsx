'use client'

import React, { useEffect, useState } from 'react'

const SHAFTS = [
  { left: '10%', w: 18, blur: 5, aC: 0.55, aG: 0.25, delay: 0.15, dur: 3.0 },
  { left: '18%', w: 40, blur: 12, aC: 0.6, aG: 0.3, delay: 0.08, dur: 3.1 },
  { left: '23%', w: 20, blur: 7, aC: 0.45, aG: 0.2, delay: 0.12, dur: 2.9 },
  { left: '27%', w: 28, blur: 8, aC: 0.65, aG: 0.32, delay: 0.05, dur: 3.0 },
  { left: '35%', w: 70, blur: 16, aC: 0.7, aG: 0.38, delay: 0.03, dur: 3.2 },
  { left: '42%', w: 45, blur: 12, aC: 0.75, aG: 0.4, delay: 0.02, dur: 3.0 },
  { left: '46%', w: 25, blur: 9, aC: 0.55, aG: 0.28, delay: 0.06, dur: 3.0 },
  { left: '50%', w: 110, blur: 22, aC: 0.85, aG: 0.5, delay: 0.0, dur: 3.3 },
  { left: '54%', w: 25, blur: 9, aC: 0.55, aG: 0.28, delay: 0.06, dur: 3.0 },
  { left: '58%', w: 45, blur: 12, aC: 0.75, aG: 0.4, delay: 0.02, dur: 3.0 },
  { left: '65%', w: 70, blur: 16, aC: 0.7, aG: 0.38, delay: 0.03, dur: 3.2 },
  { left: '73%', w: 28, blur: 8, aC: 0.65, aG: 0.32, delay: 0.05, dur: 3.0 },
  { left: '77%', w: 20, blur: 7, aC: 0.45, aG: 0.2, delay: 0.12, dur: 2.9 },
  { left: '82%', w: 40, blur: 12, aC: 0.6, aG: 0.3, delay: 0.08, dur: 3.1 },
  { left: '90%', w: 18, blur: 5, aC: 0.55, aG: 0.25, delay: 0.15, dur: 3.0 }
]

const MOTES = Array.from({ length: 120 }, (_, i) => ({
  id: i,
  size: 2 + (i % 3),
  left: ((i * 97 + 13) % 96) + 2,
  top: (i * 61 + 7) % 85,
  bg: [
    'rgba(255,255,255,1)',
    'rgba(220,240,255,1)',
    'rgba(180,220,255,0.95)',
    'rgba(144,205,244,0.9)'
  ][i % 4]!,
  delay: (i % 9) * 0.1,
  dur: 2.8 + (i % 5) * 0.25,
  dx: ((i * 41 + 13) % 70) - 35
}))

export default function LunarConfetti() {
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
  const activeShafts = isMobile ? SHAFTS.filter((_, i) => i % 2 === 0) : SHAFTS
  const moteCount = isMobile ? 60 : 120
  const activeMotes = MOTES.slice(0, moteCount)

  return (
    <div
      className="absolute inset-x-0 top-0 pointer-events-none z-50 overflow-hidden rounded-xl"
      style={{ top: '-20px', height: '600px' }}
    >
      {/* Moon source bloom */}
      <div
        className="absolute"
        style={{
          width: '280px',
          height: '160px',
          top: '-50px',
          left: '50%',
          transform: 'translateX(-50%)',
          background:
            'radial-gradient(ellipse, rgba(220,240,255,0.9) 0%, rgba(180,220,255,0.6) 35%, rgba(144,205,244,0.2) 65%, transparent 80%)',
          animation: 'lunar-bloom 3s ease-out 0.05s both'
        }}
      />
      <div
        className="absolute"
        style={{
          width: '120px',
          height: '80px',
          top: '-20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background:
            'radial-gradient(ellipse, rgba(255,255,255,1) 0%, rgba(220,240,255,0.8) 50%, transparent 75%)',
          animation: 'lunar-bloom 3s ease-out 0.1s both'
        }}
      />

      {/* Shafts */}
      {activeShafts.flatMap((d, i) => [
        // Halo
        <div
          key={`h${i}`}
          className="absolute"
          style={
            {
              top: '-5%',
              left: d.left,
              width: `${d.w * 2.5}px`,
              height: '0px',
              transform: 'translateX(-50%)',
              background: `linear-gradient(to bottom, rgba(180,220,255,${d.aG * 0.5}), rgba(144,205,244,${d.aG}), rgba(144,205,244,${d.aG * 0.5}), transparent)`,
              filter: isMobile ? undefined : `blur(${d.blur * 1.8}px)`,
              animation: `lunar-shaft-fall ${d.dur}s ease-out ${d.delay}s both`
            } as React.CSSProperties
          }
        />,
        // Core
        <div
          key={`c${i}`}
          className="absolute"
          style={
            {
              top: '-5%',
              left: d.left,
              width: `${d.w}px`,
              height: '0px',
              transform: 'translateX(-50%)',
              background: `linear-gradient(to bottom, rgba(255,255,255,${d.aC}), rgba(210,235,255,${d.aC * 0.9}), rgba(180,220,255,${d.aC * 0.7}), rgba(144,205,244,${d.aC * 0.4}), transparent)`,
              filter: isMobile ? undefined : `blur(${d.blur}px)`,
              animation: `lunar-shaft-fall ${d.dur}s ease-out ${d.delay}s both`
            } as React.CSSProperties
          }
        />,
        // Spine (only for wide shafts)
        ...(d.w >= 40 && !isMobile
          ? [
              <div
                key={`s${i}`}
                className="absolute"
                style={
                  {
                    top: '-5%',
                    left: d.left,
                    width: `${Math.max(2, Math.round(d.w * 0.08))}px`,
                    height: '0px',
                    transform: 'translateX(-50%)',
                    background:
                      'linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(255,255,255,0.7), rgba(220,240,255,0.3), transparent)',
                    filter: 'blur(1px)',
                    animation: `lunar-shaft-fall ${d.dur}s ease-out ${d.delay}s both`
                  } as React.CSSProperties
                }
              />
            ]
          : [])
      ])}

      {/* Drifting motes */}
      {activeMotes.map((m) => (
        <div
          key={`m${m.id}`}
          className="absolute rounded-full"
          style={
            {
              width: `${m.size}px`,
              height: `${m.size}px`,
              left: `${m.left}%`,
              top: `${m.top}%`,
              background: m.bg,
              boxShadow: isMobile
                ? undefined
                : `0 0 ${5 + (m.id % 3) * 3}px rgba(180,220,255,1), 0 0 ${10 + (m.id % 3) * 4}px rgba(144,205,244,0.8)`,
              animation: `lunar-mote-drift ${m.dur}s ease-in-out ${m.delay}s both`,
              opacity: 0,
              '--dx': `${m.dx}px`
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}
