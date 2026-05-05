interface ChevronUpIconProps {
  className?: string
}

export default function ChevronUpIcon({
  className = 'w-5 h-5'
}: ChevronUpIconProps) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M5 10l7-7m0 0l7 7"
      />
    </svg>
  )
}
