interface SoundIconProps {
  muted: boolean
  size?: number
}

const SoundOnIcon = () => (
  <svg viewBox="0 0 20 20">
    <path
      d="M9 4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h2l4 4V0l-4 4H9z"
      fill="#6B7280"
    />
    <path
      d="M14 6c1.5 1.5 1.5 6.5 0 8"
      fill="none"
      stroke="#3B82F6"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M15.5 4.5c2.5 2.5 2.5 8.5 0 11"
      fill="none"
      stroke="#3B82F6"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
)

const SoundOffIcon = () => (
  <svg viewBox="0 0 20 20">
    <path
      d="M9 4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h2l4 4V0l-4 4H9z"
      fill="#9CA3AF"
    />
    {/* Diagonal slash to indicate muted state */}
    <line
      x1="3"
      y1="3"
      x2="17"
      y2="17"
      stroke="#EF4444"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

const SoundIcon = ({ muted, size = 20 }: SoundIconProps) => (
  <span
    style={{ width: size, height: size }}
    className="inline-flex items-center justify-center"
  >
    {muted ? <SoundOffIcon /> : <SoundOnIcon />}
  </span>
)

export default SoundIcon
