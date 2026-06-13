import { SortDir } from '@/types/rps'

export function SortArrow({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="text-gray-300 ml-1">↕</span>
  return (
    <span className="text-purple-400 ml-1">{dir === 'desc' ? '↓' : '↑'}</span>
  )
}