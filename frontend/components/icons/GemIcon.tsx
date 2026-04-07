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
        height: `${baseSize}px`,
        color: className.includes('text-') ? undefined : '#A855F7'
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
          fill="currentColor"
          stroke="rgba(0,0,0,0.1)"
          strokeWidth="2"
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
      </svg>
    </span>
  )
}

export default GemIcon
