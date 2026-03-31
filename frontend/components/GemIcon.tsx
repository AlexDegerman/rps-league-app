interface GemIconProps {
  size?: number
}

const GemIcon = ({ size = 40 }: GemIconProps) => (
  <span
    className="inline-flex items-center justify-center"
    style={{ width: size, height: size }}
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <circle
        cx="60"
        cy="60"
        r="42"
        fill="#A855F7"
        stroke="#6B21A8"
        strokeWidth="4"
      />
      <path
        d="M40 40 Q50 30 60 35"
        fill="none"
        stroke="#DDD6FE"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M42 50 Q52 42 60 46"
        fill="none"
        stroke="#DDD6FE"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  </span>
)

export default GemIcon
