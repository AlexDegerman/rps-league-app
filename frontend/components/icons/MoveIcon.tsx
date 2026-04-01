interface MoveIconProps {
  move: string
  size?: number
}

const RockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <path
      d="M25 70 L40 45 L70 40 L95 55 L90 80 L65 95 L35 88 Z"
      fill="#6B7280"
      stroke="#374151"
      strokeWidth="4"
      strokeLinejoin="round"
    />
    <path
      d="M48 60 L60 50 L75 58"
      fill="none"
      stroke="#9CA3AF"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
)

const PaperIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <rect
      x="30"
      y="20"
      width="60"
      height="80"
      rx="6"
      fill="#F9FAFB"
      stroke="#374151"
      strokeWidth="4"
    />
    <line x1="40" y1="40" x2="80" y2="40" stroke="#9CA3AF" strokeWidth="3" />
    <line x1="40" y1="55" x2="80" y2="55" stroke="#9CA3AF" strokeWidth="3" />
    <line x1="40" y1="70" x2="70" y2="70" stroke="#9CA3AF" strokeWidth="3" />
  </svg>
)

const ScissorsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <circle
      cx="40"
      cy="80"
      r="12"
      fill="none"
      stroke="#EF4444"
      strokeWidth="6"
    />
    <circle
      cx="80"
      cy="80"
      r="12"
      fill="none"
      stroke="#EF4444"
      strokeWidth="6"
    />
    <line
      x1="48"
      y1="72"
      x2="78"
      y2="38"
      stroke="#EF4444"
      strokeWidth="6"
      strokeLinecap="round"
    />
    <line
      x1="72"
      y1="72"
      x2="42"
      y2="38"
      stroke="#EF4444"
      strokeWidth="6"
      strokeLinecap="round"
    />
  </svg>
)

const MoveIcon = ({ move, size = 40 }: MoveIconProps) => {
  return (
    <span
      className="inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      title={move}
    >
      {move === 'ROCK' && <RockIcon />}
      {move === 'PAPER' && <PaperIcon />}
      {move === 'SCISSORS' && <ScissorsIcon />}
      {move !== 'ROCK' && move !== 'PAPER' && move !== 'SCISSORS' && (
        <span className="text-xs font-bold text-gray-400">?</span>
      )}
    </span>
  )
}

export default MoveIcon
