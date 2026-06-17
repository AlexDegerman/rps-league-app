'use client'

import { RARITY_BADGE_STYLE} from '@/lib/achievements'
import { AchievementRarity, BadgeData } from '@/types/rps'

interface AchievementBadgeProps {
  badge: BadgeData
  size?: 'xs' | 'sm' | 'md'
}

export function AchievementBadge({ badge, size = 'sm' }: AchievementBadgeProps) {
  const sizeClass = {
    xs: 'text-[8px] px-1 py-0.5 gap-0.5',
    sm: 'text-[9px] px-1.5 py-0.5 gap-1',
    md: 'text-[10px] px-2 py-1 gap-1',
  }[size]

  const isRainbow = badge.rarity === 'RAINBOW'

  return (
    <span
      className={`
        inline-flex items-center rounded-md border font-black uppercase tracking-wider
        ${sizeClass}
        ${isRainbow
          ? 'rainbow-badge-bg text-purple-900 border-purple-400'
          : RARITY_BADGE_STYLE[badge.rarity as AchievementRarity]
        }
      `}
      title={`${badge.name} - ${badge.code}`}
    >
      <span>{badge.icon}</span>
      <span>{badge.code}</span>
    </span>
  )
}

interface AchievementBadgeRowProps {
  badges: BadgeData[]
  size?: 'xs' | 'sm'
}

export function AchievementBadgeRow({ badges, size = 'xs' }: AchievementBadgeRowProps) {
  if (!badges || badges.length === 0) return null
  return (
    <div className="flex flex-wrap gap-0.5 mt-1">
      {badges.map((badge) => (
        <AchievementBadge key={badge.code} badge={badge} size={size} />
      ))}
    </div>
  )
}