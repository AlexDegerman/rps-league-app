'use client'

interface GemIconProps {
  size?: number
  className?: string
}

const GemIcon = ({ size = 40, className = '' }: GemIconProps) => {
  const baseSize = size
  const svgSize = baseSize * 0.92
  const centerX = 60
  const centerY = 60 
  const radius = 42

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      style={{
        width: `${baseSize}px`,
        height: `${baseSize}px`
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 120 120"
        width={`${svgSize}px`}
        height={`${svgSize}px`}
        className="block"
      >
        <defs>
          <linearGradient id="gemGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C084FC" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="url(#gemGradient)"
          stroke="#6B21A8"
          strokeWidth="4"
          filter="url(#glow)"
        />

        <path
          d="M40 40 Q50 30 60 35"
          fill="none"
          stroke="#DDD6FE"
          strokeWidth="3"
          strokeLinecap="round"
          className="opacity-90"
        />
        <path
          d="M42 50 Q52 42 60 46"
          fill="none"
          stroke="#DDD6FE"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="opacity-80"
        />

        <path
          d="M46 60 Q54 54 60 56"
          fill="none"
          stroke="#F3E8FF"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="opacity-70"
        />
      </svg>
    </span>
  )
}

export default GemIcon
