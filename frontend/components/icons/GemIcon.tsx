'use client'

interface GemIconProps {
  size?: number
  className?: string
}

const GemIcon = ({ size = 40, className = '' }: GemIconProps) => {
  const svgSize = size * 0.92

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        // Only apply the default purple if no text-* color class was passed in
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
          cx={60}
          cy={60}
          r={42}
          fill="currentColor"
          stroke="rgba(0,0,0,0.1)"
          strokeWidth="2"
          filter="url(#glow)"
        />
        {/* Highlight streaks to give the gem a faceted look */}
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
