import Link from 'next/link'

interface Props {
  name: string
  className?: string
}

const PlayerLink = ({ name, className = '' }: Props) => (
  <Link
    href={`/player/${encodeURIComponent(name)}`}
    className={`hover:text-indigo-600 hover:underline transition ${className}`}
    onClick={(e) => e.stopPropagation()}
  >
    {name}
  </Link>
)

export default PlayerLink
