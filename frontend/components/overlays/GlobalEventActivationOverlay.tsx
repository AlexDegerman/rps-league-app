'use client'

import { useEffect, useState, useRef } from 'react'
import React from 'react'
import type { GlobalEventType } from '@/types/rps'

// TIDAL SURGE full-screen
const TS_DROPLETS = Array.from({ length: 100 }, (_, i) => {
  const angle = (i / 100) * Math.PI * 2
  const speed = 160 + (i % 9) * 40
  return {
    id: i,
    startLeft: `${2 + (i % 20) * 4.9}%`,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 100,
    size: 3 + (i % 6),
    delay: 0.1 + (i % 8) * 0.022,
    color: [
      'rgba(34,211,238,0.95)',
      'rgba(103,232,249,0.9)',
      'rgba(207,250,254,0.98)',
      'rgba(255,255,255,0.95)',
      'rgba(6,182,212,0.9)'
    ][i % 5]
  }
})
const TS_FOAM_CHUNKS = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  startLeft: `${2 + (i % 20) * 4.9}%`,
  vx: -25 + (i % 8) * 13,
  vy: -(80 + (i % 6) * 22),
  size: 8 + (i % 7) * 4,
  delay: 0.04 + (i % 6) * 0.018
}))
const TS_MISTS = Array.from({ length: 55 }, (_, i) => ({
  id: i,
  left: `${((i * 53 + 7) % 90) + 5}%`,
  top: `${3 + (i % 10) * 9}%`,
  size: 10 + (i % 9) * 6,
  delay: 0.85 + (i % 11) * 0.035
}))

function TidalActivationConfetti() {
  return (
    <div className="fixed inset-0 pointer-events-none z-200 overflow-hidden">
      <div
        className="absolute"
        style={{
          left: 0,
          top: 0,
          width: '135%',
          height: '100%',
          background:
            'linear-gradient(to right, transparent 0%, rgba(34,211,238,0.0) 5%, rgba(34,211,238,0.55) 27%, rgba(8,145,178,0.78) 50%, rgba(34,211,238,0.62) 70%, rgba(103,232,249,0.34) 87%, transparent 100%)',
          filter: 'blur(10px)',
          animation:
            'tidal-wave-slam-fs 1.1s cubic-bezier(0.18,0.65,0.38,1) 0.0s both'
        }}
      />
      <div
        className="absolute"
        style={{
          left: 0,
          top: '6%',
          width: '128%',
          height: '88%',
          background:
            'linear-gradient(to right, transparent 0%, rgba(8,145,178,0.0) 8%, rgba(8,145,178,0.65) 33%, rgba(6,120,150,0.82) 54%, rgba(8,145,178,0.58) 72%, transparent 100%)',
          filter: 'blur(14px)',
          animation:
            'tidal-wave-slam-fs 1.12s cubic-bezier(0.18,0.65,0.38,1) 0.025s both'
        }}
      />
      <div
        className="absolute"
        style={{
          left: 0,
          top: '4%',
          width: '122%',
          height: '78%',
          background:
            'linear-gradient(to right, transparent 0%, rgba(103,232,249,0.0) 10%, rgba(103,232,249,0.45) 36%, rgba(34,211,238,0.6) 55%, rgba(103,232,249,0.37) 73%, transparent 100%)',
          filter: 'blur(6px)',
          animation:
            'tidal-wave-slam-fs 1.08s cubic-bezier(0.2,0.62,0.36,1) 0.01s both'
        }}
      />
      <div
        className="absolute"
        style={{
          left: 0,
          top: 0,
          width: '120%',
          height: '100%',
          background:
            'linear-gradient(to right, transparent 0%, rgba(255,255,255,0.0) 11%, rgba(255,255,255,0.92) 36%, rgba(207,250,254,0.97) 43%, rgba(255,255,255,0.84) 49%, transparent 57%)',
          filter: 'blur(2px)',
          animation:
            'tidal-foam-slam-fs 0.9s cubic-bezier(0.15,0.58,0.32,1) 0.0s both'
        }}
      />
      <div
        className="absolute"
        style={{
          left: 0,
          top: '1%',
          width: '117%',
          height: '20%',
          background:
            'linear-gradient(to right, transparent 5%, rgba(207,250,254,0.0) 14%, rgba(255,255,255,0.88) 39%, rgba(207,250,254,0.94) 47%, transparent 59%)',
          filter: 'blur(1.5px)',
          animation:
            'tidal-foam-slam-fs 0.87s cubic-bezier(0.15,0.55,0.35,1) 0.0s both'
        }}
      />
      <div
        className="absolute"
        style={{
          left: 0,
          top: '74%',
          width: '118%',
          height: '16%',
          background:
            'linear-gradient(to right, transparent 5%, rgba(207,250,254,0.0) 17%, rgba(207,250,254,0.74) 41%, rgba(255,255,255,0.7) 49%, transparent 61%)',
          filter: 'blur(2px)',
          animation:
            'tidal-foam-slam-fs 0.92s cubic-bezier(0.15,0.55,0.35,1) 0.03s both'
        }}
      />
      <div
        className="absolute"
        style={{
          left: 0,
          top: 0,
          width: '140%',
          height: '100%',
          background:
            'linear-gradient(to right, transparent 0%, rgba(207,250,254,0.0) 18%, rgba(207,250,254,0.22) 44%, rgba(207,250,254,0.17) 61%, transparent 100%)',
          filter: 'blur(20px)',
          animation:
            'tidal-wave-slam-fs 1.2s cubic-bezier(0.18,0.65,0.38,1) 0.04s both'
        }}
      />
      {TS_FOAM_CHUNKS.map((c) => (
        <div
          key={c.id}
          className="absolute rounded-full"
          style={
            {
              width: `${c.size}px`,
              height: `${c.size * 0.65}px`,
              left: c.startLeft,
              top: `${8 + (c.id % 10) * 9}%`,
              background:
                'radial-gradient(ellipse, rgba(255,255,255,0.95) 0%, rgba(207,250,254,0.8) 60%, transparent 100%)',
              filter: 'blur(1px)',
              animation: `tidal-droplet-gravity 1.3s ease-out ${c.delay}s both`,
              ['--vx' as string]: `${c.vx}px`,
              ['--vy' as string]: `${c.vy}px`
            } as React.CSSProperties
          }
        />
      ))}
      {TS_DROPLETS.map((d) => (
        <div
          key={d.id}
          className="absolute rounded-full"
          style={
            {
              width: `${d.size}px`,
              height: `${d.size * 1.7}px`,
              left: d.startLeft,
              top: `${4 + (d.id % 10) * 9}%`,
              background: d.color,
              boxShadow: `0 0 ${d.size * 3}px rgba(34,211,238,0.75)`,
              animation: `tidal-droplet-gravity 1.6s ease-in ${d.delay}s both`,
              ['--vx' as string]: `${d.vx}px`,
              ['--vy' as string]: `${d.vy}px`
            } as React.CSSProperties
          }
        />
      ))}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(34,211,238,0.12), rgba(8,145,178,0.07))',
          animation: 'tidal-submersion-fs 2.0s ease-out 0.0s both'
        }}
      />
      {TS_MISTS.map((m) => (
        <div
          key={m.id}
          className="absolute rounded-full"
          style={{
            width: `${m.size}px`,
            height: `${m.size}px`,
            left: m.left,
            top: m.top,
            background: 'rgba(207,250,254,0.38)',
            filter: 'blur(5px)',
            animation: `tidal-mist-fade 1.0s ease-out ${m.delay}s both`
          }}
        />
      ))}
    </div>
  )
}

// SOLAR FLARE full-screen
const SF_BEAMS = [
  { left: '35%', w: 40, blur: 10, delay: 0.0, dur: 1.0 },
  { left: '50%', w: 65, blur: 15, delay: 0.0, dur: 1.0 },
  { left: '65%', w: 35, blur: 9, delay: 0.03, dur: 1.0 }
]
const SF_SPARKS = Array.from({ length: 420 }, (_, i) => {
  const angle = (i / 420) * Math.PI * 2
  const speed = 650 + (i % 9) * 110
  return {
    id: i,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 150,
    size: 4 + (i % 6),
    delay: 1.0 + (i % 6) * 0.012,
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
const SF_CORONA = [
  { size: 120, delay: 1.02, dur: 0.65 },
  { size: 260, delay: 1.06, dur: 0.8 },
  { size: 440, delay: 1.1, dur: 0.92 },
  { size: 680, delay: 1.14, dur: 1.0 },
  { size: 920, delay: 1.18, dur: 1.1 }
]
const SF_CINDERS = Array.from({ length: 80 }, (_, i) => {
  const angle = (i / 80) * Math.PI * 2
  const speed = 75 + (i % 7) * 35
  return {
    id: i,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 60,
    size: 2 + (i % 4),
    delay: 1.05 + (i % 9) * 0.02
  }
})

function SolarActivationConfetti() {
  return (
    <div className="fixed inset-0 pointer-events-none z-200 overflow-hidden">
      {/* Beams */}
      {SF_BEAMS.map((b, i) => (
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
                  'linear-gradient(to bottom, rgba(253,230,138,0.48), rgba(245,158,11,0.64), rgba(245,158,11,0.4), transparent)',
                filter: `blur(${b.blur * 1.5}px)`,
                animation: `solar-beam-down-fs ${b.dur}s ease-in ${b.delay}s both`
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
                  'linear-gradient(to bottom, rgba(255,255,255,0.97), rgba(253,230,138,0.91), rgba(245,158,11,0.74), rgba(239,68,68,0.34), transparent)',
                filter: `blur(${b.blur}px)`,
                animation: `solar-beam-down-fs ${b.dur}s ease-in ${b.delay}s both`
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
                filter: 'blur(0.5px)',
                animation: `solar-beam-down-fs ${b.dur * 0.95}s ease-in ${b.delay}s both`
              } as React.CSSProperties
            }
          />
        </React.Fragment>
      ))}

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
            width: '240px',
            height: '240px',
            left: '50%',
            top: '85%',
            transform: 'translate(-50%, -50%)',
            background:
              'radial-gradient(circle, #ffffff 0%, #fbbf24 35%, #f97316 70%, transparent 100%)',
            filter: 'blur(8px)',
            opacity: 0,
            animation:
              'solar-supernova-flash 1.4s cubic-bezier(0.1, 0.8, 0.3, 1) 1.0s both'
          }}
        />

        {SF_CORONA.map((r, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${r.size}px`,
              height: `${r.size}px`,
              left: '50%',
              top: '85%',
              border: `4px solid transparent`,
              background:
                'radial-gradient(circle, transparent 40%, #fbbf24 75%, #ef4444 100%)',
              boxShadow:
                '0 0 60px rgba(245,158,11,0.6), inset 0 0 30px rgba(239,68,68,0.4)',
              opacity: 0,
              animation: `solar-corona-ring ${r.dur}s ease-out ${r.delay}s both`
            }}
          />
        ))}

        {[160, 320, 600].map((sz, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              width: `${sz}px`,
              height: `${sz * 0.18}px`,
              left: '50%',
              top: '85%',
              background:
                'radial-gradient(ellipse, transparent 30%, #fde68a 70%, #f59e0b 100%)',
              borderRadius: '50%',
              boxShadow: '0 0 45px rgba(251,191,36,0.7)',
              opacity: 0,
              animation: `solar-corona-ring ${0.55 + i * 0.15}s ease-out ${1.02 + i * 0.03}s both`
            }}
          />
        ))}

        {SF_SPARKS.map((s) => (
          <div
            key={s.id}
            className="absolute rounded-full"
            style={
              {
                width: `${s.size}px`,
                height: `${s.size}px`,
                left: '50%',
                top: '85%',
                background: s.color,
                boxShadow: `0 0 ${s.size * 5}px ${s.glow}, 0 0 ${s.size * 10}px #ef4444`,
                opacity: 0,
                animation: `solar-spark-omnidirectional 1.1s ease-out ${s.delay}s both`,
                ['--vx' as string]: `${s.vx}px`,
                ['--vy' as string]: `${s.vy}px`
              } as React.CSSProperties
            }
          />
        ))}

        {SF_CINDERS.map((c) => (
          <div
            key={c.id}
            className="absolute rounded-full"
            style={
              {
                width: `${c.size}px`,
                height: `${c.size}px`,
                left: '50%',
                top: '85%',
                background: '#f97316',
                boxShadow: '0 0 8px #ef4444',
                opacity: 0,
                animation: `solar-cinder-rise 0.9s ease-out ${c.delay}s both`,
                ['--vx' as string]: `${c.vx}px`,
                ['--vy' as string]: `${c.vy}px`
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Flash white-out */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(255,255,255,1)',
          opacity: 0,
          animation: 'solar-thermal-flicker 0.65s ease-out 1.0s both'
        }}
      />
    </div>
  )
}

// CYCLONE BLITZ full-screen
const CB_COUNT = 240
const CB_COLORS = [
  '#0284c7',
  '#0d9488',
  '#475569',
  '#2563eb', 
  '#10b981'
]

// 48 tightly-spaced raging wind streaks spread out continuously over the full 2 seconds
const CB_WINDS = Array.from({ length: 48 }, (_, i) => ({
  id: i,
  top: `${1.5 + i * 2.0}%`,
  opacity: 0.85 + (i % 3) * 0.05,
  height: 4 + (i % 4),
  delay: i * 0.032,
  dur: 0.32 + (i % 4) * 0.08,
  direction: i % 2 === 0 ? 'ltr' : 'rtl',
  color: CB_COLORS[i % CB_COLORS.length]
}))

const CB_SHARDS = Array.from({ length: CB_COUNT }, (_, i) => {
  const angle = (i / CB_COUNT) * 360
  return {
    id: i,
    angle,
    rEnd: 280 + (i % 8) * 70,
    spinDeg: 360 + (i % 4) * 120,
    w: 3 + (i % 4),
    h: 8 + (i % 7) * 4,
    color: CB_COLORS[i % CB_COLORS.length],
    expandDelay: 0.25 + (i % 12) * 0.01,
    disperseDelay: 1.1 + (i % 12) * 0.01
  }
})

// 24 spiraling wind trails spinning inside the activation vortex
const CB_VORTEX_WINDS = Array.from({ length: 24 }, (_, i) => {
  const angle = (i / 24) * 360
  const rEnd = 200 + (i % 6) * 55
  const spinDeg = 360 + (i % 4) * 120
  return {
    id: i,
    angle,
    rEnd,
    spinDeg,
    w: 2 + (i % 3),
    h: 45 + (i % 5) * 15,
    color: CB_COLORS[i % CB_COLORS.length],
    expandDelay: 0.15 + (i % 12) * 0.01,
    expandDur: 0.95 + (i % 4) * 0.05,
    disperseDelay: 1.1 + (i % 12) * 0.01,
    disperseDur: 0.8
  }
})

function CycloneActivationConfetti() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {/* Colliding Wind Streaks */}
      {CB_WINDS.map((w) => (
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
            filter: 'blur(0.5px)',
            boxShadow: `0 0 12px ${w.color}ee, 0 0 20px rgba(255, 255, 255, 0.8)`,
            animation: `${w.direction === 'ltr' ? 'cyclone-wind-ltr-fs' : 'cyclone-wind-rtl-fs'} ${w.dur}s ease-out ${w.delay}s both`
          }}
        />
      ))}

      {/* Global vortex storm wrapper */}
      <div
        className="absolute inset-0"
        style={{
          animation:
            'cyclone-vortex-swirl 1.6s cubic-bezier(0.1, 0.8, 0.2, 1) both'
        }}
      >
        {/* Spiraling Wind Trails */}
        {CB_VORTEX_WINDS.map((vw) => (
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
                  ['--angle' as string]: `${vw.angle}deg`,
                  ['--r-start' as string]: '12px'
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
                  boxShadow: `0 0 6px ${vw.color}, 0 0 12px ${vw.color}88`,
                  borderRadius: '1px',
                  animation: `cyclone-expand-orbit ${vw.expandDur}s cubic-bezier(0.08,0.85,0.25,1) ${vw.expandDelay}s both`,
                  ['--angle' as string]: `${vw.angle}deg`,
                  ['--r-start' as string]: '12px',
                  ['--r-end' as string]: `${vw.rEnd}px`,
                  ['--spin' as string]: `${vw.spinDeg}deg`
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
                  animation: `cyclone-disperse 0.6s ease-out ${vw.disperseDelay}s both`,
                  ['--angle' as string]: `${vw.angle + vw.spinDeg}deg`,
                  ['--r-end' as string]: `${vw.rEnd}px`
                } as React.CSSProperties
              }
            />
          </div>
        ))}

        {/* Shards */}
        {CB_SHARDS.map((s) => (
          <React.Fragment key={s.id}>
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
                  ['--angle' as string]: `${s.angle}deg`,
                  ['--r-start' as string]: '12px'
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
                  boxShadow: `0 0 8px ${s.color}, 0 0 18px ${s.color}aa`,
                  borderRadius: '1px',
                  animation: `cyclone-expand-orbit 0.7s cubic-bezier(0.08,0.85,0.25,1) ${s.expandDelay}s both`,
                  ['--angle' as string]: `${s.angle}deg`,
                  ['--r-start' as string]: '12px',
                  ['--r-end' as string]: `${s.rEnd}px`,
                  ['--spin' as string]: `${s.spinDeg}deg`
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
                  animation: `cyclone-disperse 0.6s ease-out ${s.disperseDelay}s both`,
                  ['--angle' as string]: `${s.angle + s.spinDeg}deg`,
                  ['--r-end' as string]: `${s.rEnd}px`
                } as React.CSSProperties
              }
            />
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

// MIRAGE CATACLYSM full-screen
const MC_BURST = Array.from({ length: 260 }, (_, i) => {
  const angle = (i / 260) * Math.PI * 2
  const speed = 320 + (i % 9) * 80
  const isScarab = i % 2 === 0
  return {
    id: i,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 120,
    size: isScarab ? 9 + (i % 4) * 3 : 5 + (i % 5) * 2,
    spin: `${(i % 2 === 0 ? 1 : -1) * (180 + (i % 4) * 90)}deg`,
    delay: (i % 7) * 0.015,
    color: isScarab ? '#f59e0b' : '#a855f7',
    glow: isScarab ? 'rgba(245,158,11,0.92)' : 'rgba(168,85,247,0.88)'
  }
})
const MC_DUST = Array.from({ length: 150 }, (_, i) => ({
  id: i,
  left: `${((i * 79 + 11) % 90) + 5}%`,
  top: `${2 + (i % 11) * 9}%`,
  size: 1 + (i % 4),
  startX: `${65 + (i % 7) * 22}px`,
  amp: `${(i % 2 === 0 ? 1 : -1) * (10 + (i % 6) * 6)}px`,
  color: [
    '#fde68a',
    '#d97706',
    '#a855f7',
    '#fbbf24',
    '#c4b5fd',
    '#f59e0b',
    '#e9d5ff'
  ][i % 7],
  sweepDelay: 0.3 + (i % 11) * 0.038,
  sweepDur: 0.7,
  decayDelay: 1.1 + (i % 11) * 0.028,
  decayDur: 0.7,
  startOpacity: 0.65 + (i % 4) * 0.1
}))

function MirageActivationConfetti() {
  return (
    <div className="fixed inset-0 pointer-events-none z-200 overflow-hidden">
      <div
        className="absolute"
        style={{
          top: 0,
          right: 0,
          width: '175%',
          height: '100%',
          background:
            'linear-gradient(to left, transparent 0%, rgba(245,158,11,0.0) 4%, rgba(245,158,11,0.54) 26%, rgba(217,119,6,0.76) 48%, rgba(168,85,247,0.46) 68%, rgba(245,158,11,0.3) 84%, transparent 100%)',
          filter: 'blur(10px)',
          animation:
            'mirage-dust-wall-fs 1.6s cubic-bezier(0.12,0.55,0.3,1) 0.0s both'
        }}
      />
      <div
        className="absolute"
        style={{
          top: '6%',
          right: 0,
          width: '165%',
          height: '88%',
          background:
            'linear-gradient(to left, transparent 0%, rgba(180,83,9,0.0) 7%, rgba(180,83,9,0.64) 30%, rgba(146,64,14,0.8) 52%, rgba(180,83,9,0.52) 70%, transparent 100%)',
          filter: 'blur(14px)',
          animation:
            'mirage-dust-wall-fs 1.65s cubic-bezier(0.12,0.55,0.3,1) 0.03s both'
        }}
      />
      <div
        className="absolute"
        style={{
          top: '4%',
          right: 0,
          width: '158%',
          height: '78%',
          background:
            'linear-gradient(to left, transparent 0%, rgba(168,85,247,0.0) 11%, rgba(168,85,247,0.44) 37%, rgba(124,58,237,0.56) 56%, rgba(168,85,247,0.34) 73%, transparent 100%)',
          filter: 'blur(7px)',
          animation:
            'mirage-dust-wall-fs 1.58s cubic-bezier(0.12,0.55,0.3,1) 0.01s both'
        }}
      />
      <div
        className="absolute"
        style={{
          top: 0,
          right: 0,
          width: '152%',
          height: '100%',
          background:
            'linear-gradient(to left, transparent 0%, rgba(253,230,138,0.0) 11%, rgba(253,230,138,0.9) 34%, rgba(245,158,11,0.95) 41%, rgba(253,230,138,0.8) 48%, transparent 56%)',
          filter: 'blur(2.5px)',
          animation:
            'mirage-dust-wall-fs 1.55s cubic-bezier(0.14,0.58,0.3,1) 0.0s both'
        }}
      />
      <div
        className="absolute"
        style={{
          top: '1%',
          right: 0,
          width: '148%',
          height: '20%',
          background:
            'linear-gradient(to left, transparent 5%, rgba(253,230,138,0.0) 14%, rgba(255,255,255,0.8) 38%, rgba(253,230,138,0.9) 46%, transparent 58%)',
          filter: 'blur(1.5px)',
          animation:
            'mirage-dust-wall-fs 1.52s cubic-bezier(0.15,0.55,0.3,1) 0.0s both'
        }}
      />
      <div
        className="absolute"
        style={{
          top: '75%',
          right: 0,
          width: '150%',
          height: '16%',
          background:
            'linear-gradient(to left, transparent 5%, rgba(168,85,247,0.0) 16%, rgba(168,85,247,0.7) 40%, rgba(124,58,237,0.64) 48%, transparent 60%)',
          filter: 'blur(2px)',
          animation:
            'mirage-dust-wall-fs 1.62s cubic-bezier(0.15,0.55,0.3,1) 0.04s both'
        }}
      />
      <div
        className="absolute"
        style={{
          top: '20%',
          right: 0,
          width: '162%',
          height: '50%',
          background:
            'linear-gradient(to left, transparent, rgba(168,85,247,0.38) 28%, rgba(245,158,11,0.48) 62%, transparent)',
          filter: 'blur(6px)',
          animation:
            'mirage-dust-wall-fs 1.8s cubic-bezier(0.12,0.55,0.3,1) 0.18s both'
        }}
      />
      <div
        className="absolute"
        style={{
          top: 0,
          right: 0,
          width: '185%',
          height: '100%',
          background:
            'linear-gradient(to left, transparent 0%, rgba(253,230,138,0.0) 18%, rgba(253,230,138,0.2) 43%, rgba(168,85,247,0.13) 60%, transparent 100%)',
          filter: 'blur(22px)',
          animation:
            'mirage-dust-wall-fs 1.7s cubic-bezier(0.12,0.65,0.3,1) 0.05s both'
        }}
      />
      {MC_BURST.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-sm"
          style={
            {
              width: `${p.size}px`,
              height: `${p.size}px`,
              left: '50%',
              top: '50%',
              background: `radial-gradient(circle, ${p.color}, ${p.color}99)`,
              boxShadow: `0 0 ${p.size * 3}px ${p.glow}`,
              animation: `mirage-radial-burst 1.8s ease-out ${p.delay}s both`,
              ['--vx' as string]: `${p.vx}px`,
              ['--vy' as string]: `${p.vy}px`,
              ['--spin' as string]: p.spin
            } as React.CSSProperties
          }
        />
      ))}
      {MC_DUST.map((d) => (
        <div key={d.id}>
          <div
            className="absolute rounded-full"
            style={
              {
                width: `${d.size}px`,
                height: `${d.size}px`,
                left: d.left,
                top: d.top,
                background: d.color,
                animation: `mirage-sine-sweep ${d.sweepDur}s ease-in-out ${d.sweepDelay}s both`,
                ['--start-x' as string]: d.startX,
                ['--amp' as string]: d.amp
              } as React.CSSProperties
            }
          />
          <div
            className="absolute rounded-full"
            style={
              {
                width: `${d.size}px`,
                height: `${d.size}px`,
                left: d.left,
                top: d.top,
                background: d.color,
                animation: `mirage-alpha-decay ${d.decayDur}s ease-out ${d.decayDelay}s both`,
                ['--start-opacity' as string]: d.startOpacity
              } as React.CSSProperties
            }
          />
        </div>
      ))}
      <div
        className="absolute"
        style={{
          width: '380px',
          height: '190px',
          top: '-50px',
          left: '50%',
          background:
            'radial-gradient(ellipse, rgba(245,158,11,0.78) 0%, rgba(168,85,247,0.48) 45%, transparent 72%)',
          filter: 'blur(14px)',
          animation: 'mirage-apex-bloom-fs 1.8s ease-out 0.05s both'
        }}
      />
    </div>
  )
}

const EVENT_CONFIG: Record<
  GlobalEventType,
  {
    label: string
    eyebrowColor: string
    eyebrowBorder: string
    nameClass: string
    tintColor: string
    totalMs: number
    revealDelayMs: number
    fadeStartMs: number
  }
> = {
  TIDAL_SURGE: {
    label: 'Tidal Surge',
    eyebrowColor: '#22d3ee',
    eyebrowBorder: 'rgba(34,211,238,0.4)',
    nameClass: 'g-trg',
    tintColor: 'rgba(34,211,238,0.1)',
    totalMs: 2000,
    revealDelayMs: 80,
    fadeStartMs: 1500
  },
  SOLAR_FLARE: {
    label: 'Solar Flare',
    eyebrowColor: '#f59e0b',
    eyebrowBorder: 'rgba(245,158,11,0.4)',
    nameClass: 'g-ttr',
    tintColor: 'rgba(245,158,11,0.1)',
    totalMs: 2000,
    revealDelayMs: 80,
    fadeStartMs: 1500
  },
  CYCLONE_BLITZ: {
    label: 'Cyclone Blitz',
    eyebrowColor: '#94a3b8',
    eyebrowBorder: 'rgba(148,163,184,0.4)',
    nameClass: 'g-utr',
    tintColor: 'rgba(148,163,184,0.08)',
    totalMs: 2000,
    revealDelayMs: 80,
    fadeStartMs: 1500
  },
  MIRAGE_CATACLYSM: {
    label: 'Mirage Cataclysm',
    eyebrowColor: '#d97706',
    eyebrowBorder: 'rgba(168,85,247,0.4)',
    nameClass: 'g-qntr',
    tintColor: 'rgba(168,85,247,0.07)',
    totalMs: 2000,
    revealDelayMs: 80,
    fadeStartMs: 1500
  }
}

interface GlobalEventActivationOverlayProps {
  event: GlobalEventType | null
  onDone: () => void
}

type Phase = 'burst' | 'reveal' | 'fade' | 'done'

export default function GlobalEventActivationOverlay({
  event,
  onDone
}: GlobalEventActivationOverlayProps) {
  const config = event ? EVENT_CONFIG[event] : null

  const [prevEvent, setPrevEvent] = useState<GlobalEventType | null>(null)
  const [phase, setPhase] = useState<Phase>('burst')

  // Adjust state inline during render phase to eliminate cascading render warnings
  if (event !== prevEvent) {
    setPrevEvent(event)
    setPhase('burst')
  }

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    if (!config) {
      onDone()
      return
    }

    timersRef.current.forEach(clearTimeout)
    timersRef.current = []

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
      <div
        className="fixed inset-0 pointer-events-none z-198"
        style={{
          background: config.tintColor,
          opacity: containerFading ? 0 : 1,
          transition: containerFading ? 'opacity 500ms ease-out' : 'none'
        }}
      />
      <div
        style={{
          opacity: containerFading ? 0 : 1,
          transition: containerFading ? 'opacity 400ms ease-out' : 'none'
        }}
      >
        {event === 'TIDAL_SURGE' && <TidalActivationConfetti />}
        {event === 'SOLAR_FLARE' && <SolarActivationConfetti />}
        {event === 'CYCLONE_BLITZ' && <CycloneActivationConfetti />}
        {event === 'MIRAGE_CATACLYSM' && <MirageActivationConfetti />}
      </div>
      <div
        className="fixed inset-0 pointer-events-none z-201 flex flex-col items-center justify-start pt-[22vh]"
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
          <span
            className="text-[10px] font-black uppercase tracking-[0.35em] px-4 py-1 rounded-full border"
            style={{
              color: config.eyebrowColor,
              borderColor: config.eyebrowBorder,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(8px)'
            }}
          >
            GLOBAL EVENT
          </span>
          <span
            className={`${config.nameClass} font-black text-5xl sm:text-7xl uppercase tracking-tight leading-none text-center`}
          >
            {config.label}
          </span>
          <span
            className="text-white/70 text-sm sm:text-base font-black uppercase tracking-[0.3em]"
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}
          >
            NOW ACTIVE
          </span>
        </div>
      </div>
    </>
  )
}
