'use client'

interface GemIconProps {
  size?: number
  className?: string
}

// Full rewrite of GemIcon.tsx
const GemIcon = ({ size = 40, className = '' }: GemIconProps) => {
  // We use a base size for the wrapper and scale the SVG inside it
  const baseSize = size
  const svgSize = baseSize * 0.92 // Make SVG slightly smaller than the container to allow for padding/stroke
  const centerX = 60 // SVG viewBox center X
  const centerY = 60 // SVG viewBox center Y
  const radius = 42 // Circle radius from original code

  return (
    <span
      // Keep flex centering, add shrink-0 to prevent squash, and include the dynamic className
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
        className="block" // Prevent baseline alignment issues
      >
        {/* Main Circle - Purple Gradient Effect */}
        <defs>
          <linearGradient id="gemGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C084FC" /> {/* Lighter Purple */}
            <stop offset="100%" stopColor="#A855F7" /> {/* Original Purple */}
          </linearGradient>
          {/* Subtle Outer Glow */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* The Core Circle (Main "Gem") */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="url(#gemGradient)"
          stroke="#6B21A8" // Dark Purple Stroke
          strokeWidth="4"
          filter="url(#glow)" // Apply glow to the whole circle
        />

        {/* The Shine Effects (Original Paths) */}
        <path
          d="M40 40 Q50 30 60 35"
          fill="none"
          stroke="#DDD6FE" // Very Light Purple/White
          strokeWidth="3"
          strokeLinecap="round"
          className="opacity-90" // Make shine slightly subtle
        />
        <path
          d="M42 50 Q52 42 60 46"
          fill="none"
          stroke="#DDD6FE"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="opacity-80"
        />

        {/* Bonus: Add a third, tiny inner shine for more depth */}
        <path
          d="M46 60 Q54 54 60 56"
          fill="none"
          stroke="#F3E8FF" // Extra Light Purple
          strokeWidth="1.5"
          strokeLinecap="round"
          className="opacity-70"
        />
      </svg>
    </span>
  )
}

export default GemIcon
