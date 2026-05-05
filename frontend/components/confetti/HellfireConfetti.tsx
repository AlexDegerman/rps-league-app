export default function HellfireConfetti() {
  return (
    <div
      className="absolute inset-x-0 pointer-events-none z-50 overflow-hidden rounded-xl"
      style={{ top: '-20px', height: '600px' }}
    >
      {/* screen flash on ignition */}
      <div
        className="absolute inset-0 rounded-xl"
        style={{
          background:
            'radial-gradient(ellipse at 50% 100%, #ef444466, transparent 70%)',
          animation: 'hellfire-screen-flash 1.2s ease-out forwards'
        }}
      />

      {/* ground glow bar */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: '28px',
          background:
            'linear-gradient(to top, #dc2626cc, #ef444433, transparent)',
          animation: 'hellfire-glow-pulse 0.9s ease-in-out infinite',
          borderRadius: '0 0 12px 12px'
        }}
      />

      {/* main flame columns - 100 particles in 3 size tiers */}
      {Array.from({ length: 100 }).map((_, i) => {
        const tier = i % 3
        const size = [6, 11, 18][tier]
        const colors = [
          ['#ef4444', '#f97316'],
          ['#dc2626', '#fbbf24'],
          ['#b91c1c', '#fb923c'],
          ['#7f1d1d', '#ef4444'],
          ['#991b1b', '#f97316'],
          ['#fbbf24', '#ef4444']
        ]
        const [c1, c2] = colors[i % 6]
        const col = (i % 18) * 5.7
        const vyBase = -(90 + (i % 5) * 30)
        const vyFull = -(150 + (i % 7) * 40)
        const sx = 0.7 + (i % 4) * 0.2
        const delay = (i % 12) * 0.04
        const dur = 0.7 + (i % 5) * 0.12
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
                filter: `blur(${[0.5, 1, 1.8][tier]}px)`,
                animation: `hellfire-rise ${dur}s ease-out ${delay}s infinite`,
                '--vy': `${vyBase}px`,
                '--vy-full': `${vyFull}px`,
                '--sx': sx
              } as React.CSSProperties
            }
          />
        )
      })}

      {/* flying embers - 60 sparks */}
      {Array.from({ length: 60 }).map((_, i) => {
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
                boxShadow: `0 0 ${size * 2}px ${i % 2 === 0 ? '#fbbf24' : '#ef4444'}`,
                animation: `hellfire-ember ${0.6 + (i % 6) * 0.15}s ease-out ${(i % 10) * 0.06}s infinite`,
                '--vx': `${((i * 37 + 11) % 120) - 60}px`,
                '--vy': `${-(60 + ((i * 23 + 7) % 100))}px`
              } as React.CSSProperties
            }
          />
        )
      })}

      {/* heat shimmer columns - 14 vertical wisps */}
      {Array.from({ length: 14 }).map((_, i) => (
        <div
          key={`s${i}`}
          className="absolute pointer-events-none"
          style={
            {
              width: '3px',
              height: `${40 + (i % 4) * 20}px`,
              left: `${4 + i * 7}%`,
              bottom: '6%',
              background:
                'linear-gradient(to top, rgba(251,146,60,0.35), transparent)',
              borderRadius: '2px',
              filter: 'blur(2px)',
              animation: `hellfire-shimmer ${0.8 + (i % 3) * 0.2}s ease-out ${i * 0.07}s infinite`
            } as React.CSSProperties
          }
        />
      ))}

      {/* ash floaters - 20 tiny grey flecks drifting up */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={`a${i}`}
          className="absolute pointer-events-none rounded-full"
          style={
            {
              width: `${1 + (i % 2)}px`,
              height: `${1 + (i % 2)}px`,
              left: `${(i * 47 + 3) % 95}%`,
              bottom: `${10 + (i % 6) * 7}%`,
              background: '#9ca3af',
              opacity: 0.6,
              animation: `hellfire-ember ${1.4 + (i % 4) * 0.3}s ease-out ${i * 0.09}s infinite`,
              '--vx': `${((i * 19 + 5) % 60) - 30}px`,
              '--vy': `${-(80 + ((i * 11 + 3) % 80))}px`
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}