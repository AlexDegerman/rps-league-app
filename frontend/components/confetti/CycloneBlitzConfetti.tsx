'use client'

import React, { useEffect, useState } from 'react'

const SHARD_COUNT = 180
const COLORS = [
  '#0284c7',
  '#0d9488',
  '#475569',
  '#2563eb',
  '#10b981',
  '#f8fafc'
]

const SHARDS = Array.from({ length: SHARD_COUNT }, (_, i) => {
  const angle = (i / SHARD_COUNT) * 360
  const rEnd = 240 + (i % 7) * 65
  const spinDeg = 360 + (i % 4) * 120
  return {
    id: i,
    angle,
    rEnd,
    spinDeg,
    w: 3 + (i % 4),
    h: 8 + (i % 6) * 4,
    color: COLORS[i % COLORS.length],
    expandDelay: 0.25 + (i % 12) * 0.01,
    expandDur: 1.1,
    disperseDelay: 1.1 + (i % 12) * 0.01,
    disperseDur: 0.85
  }
})

// 20 spiraling wind trails expanding centrifugally inside the vortex
const VORTEX_WINDS = Array.from({ length: 20 }, (_, i) => {
  const angle = (i / 20) * 360
  const rEnd = 180 + (i % 5) * 45
  const spinDeg = 360 + (i % 4) * 120
  return {
    id: i,
    angle,
    rEnd,
    spinDeg,
    w: 2 + (i % 3),
    h: 40 + (i % 4) * 12,
    color: COLORS[i % COLORS.length],
    expandDelay: 0.2 + (i % 10) * 0.01,
    expandDur: 1.0 + (i % 4) * 0.05,
    disperseDelay: 1.1 + (i % 10) * 0.01,
    disperseDur: 0.85
  }
})

// 32 colliding horizontal wind streaks spread out continuously over 2 seconds
const WIND_STREAKS = Array.from({ length: 32 }, (_, i) => ({
  id: i,
  top: `${8 + i * 2.6}%`,
  height: 3 + (i % 3),
  opacity: 0.85 + (i % 3) * 0.05,
  delay: i * 0.045,
  dur: 0.35 + (i % 3) * 0.1,
  direction: i % 2 === 0 ? 'ltr' : 'rtl',
  color: COLORS[i % COLORS.length]
}))

export default function CycloneBlitzConfetti() {
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
  const activeShards = isMobile ? SHARDS.slice(0, 90) : SHARDS
  const activeVortex = isMobile ? VORTEX_WINDS.slice(0, 10) : VORTEX_WINDS
  const activeStreaks = isMobile
    ? WIND_STREAKS.filter((_, i) => i % 2 === 0)
    : WIND_STREAKS

  return (
    <div
      className="absolute inset-x-0 pointer-events-none z-50"
      style={{ top: '-340px', height: '680px' }}
    >
      {/* Colliding Horizontal Winds */}
      <div
        className="absolute inset-x-0 pointer-events-none"
        style={{ top: 0, height: '100%' }}
      >
        {activeStreaks.map((w) => (
          <div
            key={w.id}
            className="absolute"
            style={{
              top: w.top,
              left: 0,
              width: '100%',
              height: `${w.height}px`,
              background: `linear-gradient(to right, transparent, ${w.color} 15%, ${w.color} 85%, transparent)`,
              opacity: w.opacity,
              filter: isMobile ? undefined : 'blur(0.5px)',
              boxShadow: isMobile
                ? undefined
                : `0 0 10px ${w.color}ee, 0 0 18px rgba(255,255,255,0.8)`,
              animation: `${w.direction === 'ltr' ? 'cyclone-wind-ltr' : 'cyclone-wind-rtl'} ${w.dur}s ease-out ${w.delay}s both`
            }}
          />
        ))}
      </div>

      {/* Shard and Vortex Wind Container */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl z-50">
        <div
          className="absolute inset-0"
          style={{
            animation:
              'cyclone-vortex-swirl 1.6s cubic-bezier(0.1, 0.8, 0.2, 1) both'
          }}
        >
          {/* Spiraling Wind Trails */}
          {activeVortex.map((vw) => (
            <div key={`vortex-wind-${vw.id}`}>
              <div
                className="absolute"
                style={
                  {
                    width: `${vw.w}px`,
                    height: `${vw.h}px`,
                    left: '50%',
                    top: '50%',
                    marginLeft: `-${vw.w / 2}px`,
                    marginTop: `-${vw.h / 2}px`,
                    background: vw.color,
                    borderRadius: '1px',
                    animation: `cyclone-spawn-compress 0.4s ease-out ${(vw.id % 12) * 0.005}s both`,
                    '--angle': `${vw.angle}deg`,
                    '--r-start': '12px'
                  } as React.CSSProperties
                }
              />
              <div
                className="absolute"
                style={
                  {
                    width: `${vw.w}px`,
                    height: `${vw.h}px`,
                    left: '50%',
                    top: '50%',
                    marginLeft: `-${vw.w / 2}px`,
                    marginTop: `-${vw.h / 2}px`,
                    background: vw.color,
                    boxShadow: isMobile
                      ? undefined
                      : `0 0 6px ${vw.color}, 0 0 12px ${vw.color}88`,
                    borderRadius: '1px',
                    animation: `cyclone-expand-orbit ${vw.expandDur}s cubic-bezier(0.08,0.85,0.25,1) ${vw.expandDelay}s both`,
                    '--angle': `${vw.angle}deg`,
                    '--r-start': '12px',
                    '--r-end': `${vw.rEnd}px`,
                    '--spin': `${vw.spinDeg}deg`
                  } as React.CSSProperties
                }
              />
              <div
                className="absolute"
                style={
                  {
                    width: `${vw.w}px`,
                    height: `${vw.h}px`,
                    left: '50%',
                    top: '50%',
                    marginLeft: `-${vw.w / 2}px`,
                    marginTop: `-${vw.h / 2}px`,
                    background: vw.color,
                    borderRadius: '1px',
                    animation: `cyclone-disperse ${vw.disperseDur}s ease-out ${vw.disperseDelay}s both`,
                    '--angle': `${vw.angle + vw.spinDeg}deg`,
                    '--r-end': `${vw.rEnd}px`
                  } as React.CSSProperties
                }
              />
            </div>
          ))}

          {/* Shards */}
          {activeShards.map((s) => (
            <div key={`shard-${s.id}`}>
              <div
                className="absolute"
                style={
                  {
                    width: `${s.w}px`,
                    height: `${s.h}px`,
                    left: '50%',
                    top: '50%',
                    marginLeft: `-${s.w / 2}px`,
                    marginTop: `-${s.h / 2}px`,
                    background: s.color,
                    borderRadius: '1px',
                    animation: `cyclone-spawn-compress 0.4s ease-out ${(s.id % 12) * 0.005}s both`,
                    '--angle': `${s.angle}deg`,
                    '--r-start': '12px'
                  } as React.CSSProperties
                }
              />
              <div
                className="absolute"
                style={
                  {
                    width: `${s.w}px`,
                    height: `${s.h}px`,
                    left: '50%',
                    top: '50%',
                    marginLeft: `-${s.w / 2}px`,
                    marginTop: `-${s.h / 2}px`,
                    background: s.color,
                    boxShadow: isMobile
                      ? undefined
                      : `0 0 6px ${s.color}, 0 0 12px ${s.color}88`,
                    borderRadius: '1px',
                    animation: `cyclone-expand-orbit ${s.expandDur}s cubic-bezier(0.08,0.85,0.25,1) ${s.expandDelay}s both`,
                    '--angle': `${s.angle}deg`,
                    '--r-start': '12px',
                    '--r-end': `${s.rEnd}px`,
                    '--spin': `${s.spinDeg}deg`
                  } as React.CSSProperties
                }
              />
              <div
                className="absolute"
                style={
                  {
                    width: `${s.w}px`,
                    height: `${s.h}px`,
                    left: '50%',
                    top: '50%',
                    marginLeft: `-${s.w / 2}px`,
                    marginTop: `-${s.h / 2}px`,
                    background: s.color,
                    borderRadius: '1px',
                    animation: `cyclone-disperse ${s.disperseDur}s ease-out ${s.disperseDelay}s both`,
                    '--angle': `${s.angle + s.spinDeg}deg`,
                    '--r-end': `${s.rEnd}px`
                  } as React.CSSProperties
                }
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
