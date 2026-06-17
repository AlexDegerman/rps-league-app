import React from 'react'

// 200 scarab coins + amethyst shards
const BURST_PARTICLES = Array.from({ length: 200 }, (_, i) => {
  const angle = (i / 200) * Math.PI * 2
  const speed = 250 + (i % 8) * 70
  const isScarab = i % 2 === 0
  return {
    id: i,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 100,
    size: isScarab ? 8 + (i % 4) * 3 : 5 + (i % 5) * 2,
    spin: `${(i % 2 === 0 ? 1 : -1) * (180 + (i % 4) * 90)}deg`,
    delay: (i % 6) * 0.018,
    dur: 2.8,
    isScarab,
    color: isScarab ? '#f59e0b' : '#a855f7',
    glow: isScarab ? 'rgba(245,158,11,0.9)' : 'rgba(168,85,247,0.85)'
  }
})

// 120 sine-wave dust particles across full height
const DUST_PARTICLES = Array.from({ length: 120 }, (_, i) => ({
  id: i,
  left: `${((i * 79 + 11) % 90) + 5}%`,
  top: `${3 + (i % 10) * 9}%`,
  size: 1 + (i % 4),
  startX: `${70 + (i % 6) * 22}px`,
  amp: `${(i % 2 === 0 ? 1 : -1) * (10 + (i % 5) * 6)}px`,
  color: [
    '#fde68a',
    '#d97706',
    '#a855f7',
    '#fbbf24',
    '#c4b5fd',
    '#f59e0b',
    '#e9d5ff'
  ][i % 7],
  sweepDelay: 0.4 + (i % 10) * 0.045,
  sweepDur: 1.0,
  decayDelay: 1.4 + (i % 10) * 0.03,
  decayDur: 1.0,
  startOpacity: 0.65 + (i % 4) * 0.1
}))

export default function MirageCataclysmConfetti() {
  return (
    <div
      className="absolute inset-x-0 pointer-events-none z-50 overflow-hidden rounded-xl"
      style={{ top: '-340px', height: '680px' }}
    >
      {/* Main wall body */}
      <div
        className="absolute"
        style={{
          top: 0,
          right: 0,
          width: '175%',
          height: '100%',
          background:
            'linear-gradient(to left, transparent 0%, rgba(245,158,11,0.0) 4%, rgba(245,158,11,0.52) 25%, rgba(217,119,6,0.74) 48%, rgba(168,85,247,0.44) 68%, rgba(245,158,11,0.28) 84%, transparent 100%)',
          filter: 'blur(10px)',
          animation:
            'mirage-dust-wall 1.6s cubic-bezier(0.12,0.55,0.3,1) 0.0s both'
        }}
      />
      {/* Deep amber underbody */}
      <div
        className="absolute"
        style={{
          top: '6%',
          right: 0,
          width: '165%',
          height: '88%',
          background:
            'linear-gradient(to left, transparent 0%, rgba(180,83,9,0.0) 7%, rgba(180,83,9,0.62) 30%, rgba(146,64,14,0.78) 52%, rgba(180,83,9,0.5) 70%, transparent 100%)',
          filter: 'blur(14px)',
          animation:
            'mirage-dust-wall 1.65s cubic-bezier(0.12,0.55,0.3,1) 0.03s both'
        }}
      />
      {/* Purple mid shimmer */}
      <div
        className="absolute"
        style={{
          top: '5%',
          right: 0,
          width: '158%',
          height: '76%',
          background:
            'linear-gradient(to left, transparent 0%, rgba(168,85,247,0.0) 11%, rgba(168,85,247,0.42) 37%, rgba(124,58,237,0.54) 56%, rgba(168,85,247,0.32) 72%, transparent 100%)',
          filter: 'blur(7px)',
          animation:
            'mirage-dust-wall 1.58s cubic-bezier(0.12,0.55,0.3,1) 0.01s both'
        }}
      />
      {/* Leading edge crest, bright amber */}
      <div
        className="absolute"
        style={{
          top: 0,
          right: 0,
          width: '152%',
          height: '100%',
          background:
            'linear-gradient(to left, transparent 0%, rgba(253,230,138,0.0) 11%, rgba(253,230,138,0.88) 34%, rgba(245,158,11,0.94) 41%, rgba(253,230,138,0.78) 48%, transparent 56%)',
          filter: 'blur(2.5px)',
          animation:
            'mirage-dust-wall 1.55s cubic-bezier(0.14,0.58,0.3,1) 0.0s both'
        }}
      />
      {/* Upper band */}
      <div
        className="absolute"
        style={{
          top: '1%',
          right: 0,
          width: '148%',
          height: '20%',
          background:
            'linear-gradient(to left, transparent 5%, rgba(253,230,138,0.0) 14%, rgba(255,255,255,0.82) 38%, rgba(253,230,138,0.9) 46%, transparent 58%)',
          filter: 'blur(1.5px)',
          animation:
            'mirage-dust-wall 1.52s cubic-bezier(0.15,0.55,0.3,1) 0.0s both'
        }}
      />
      {/* Lower band */}
      <div
        className="absolute"
        style={{
          top: '74%',
          right: 0,
          width: '150%',
          height: '16%',
          background:
            'linear-gradient(to left, transparent 5%, rgba(168,85,247,0.0) 16%, rgba(168,85,247,0.68) 40%, rgba(124,58,237,0.62) 48%, transparent 60%)',
          filter: 'blur(2px)',
          animation:
            'mirage-dust-wall 1.62s cubic-bezier(0.15,0.55,0.3,1) 0.04s both'
        }}
      />
      {/* Second offset wave */}
      <div
        className="absolute"
        style={{
          top: '18%',
          right: 0,
          width: '160%',
          height: '55%',
          background:
            'linear-gradient(to left, transparent, rgba(168,85,247,0.36) 28%, rgba(245,158,11,0.46) 60%, transparent)',
          filter: 'blur(6px)',
          animation:
            'mirage-dust-wall 1.8s cubic-bezier(0.12,0.55,0.3,1) 0.18s both'
        }}
      />
      {/* Spray veil */}
      <div
        className="absolute"
        style={{
          top: 0,
          right: 0,
          width: '185%',
          height: '100%',
          background:
            'linear-gradient(to left, transparent 0%, rgba(253,230,138,0.0) 16%, rgba(253,230,138,0.18) 42%, rgba(168,85,247,0.12) 60%, transparent 100%)',
          filter: 'blur(22px)',
          animation:
            'mirage-dust-wall 1.7s cubic-bezier(0.12,0.65,0.3,1) 0.05s both'
        }}
      />

      {/* Radial burst from center */}
      {BURST_PARTICLES.map((p) => (
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
              animation: `mirage-radial-burst 2.8s ease-out ${p.delay}s both`,
              '--vx': `${p.vx}px`,
              '--vy': `${p.vy}px`,
              '--spin': p.spin
            } as React.CSSProperties
          }
        />
      ))}

      {/* Sine-wave dust */}
      {DUST_PARTICLES.map((d) => (
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
                '--start-x': d.startX,
                '--amp': d.amp
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
                '--start-opacity': d.startOpacity
              } as React.CSSProperties
            }
          />
        </div>
      ))}

      {/* Apex bloom */}
      <div
        className="absolute"
        style={{
          width: '280px',
          height: '140px',
          top: '-30px',
          left: '50%',
          background:
            'radial-gradient(ellipse, rgba(245,158,11,0.78) 0%, rgba(168,85,247,0.48) 45%, transparent 72%)',
          filter: 'blur(12px)',
          animation: 'mirage-apex-bloom 2.5s ease-out 0.05s both'
        }}
      />

      {/* Heat tint */}
      <div
        className="absolute inset-0 rounded-xl"
        style={
          {
            background:
              'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(168,85,247,0.08))',
            animation: 'mirage-alpha-decay 2.8s ease-out 0.2s both',
            '--start-opacity': 1
          } as React.CSSProperties
        }
      />
    </div>
  )
}
