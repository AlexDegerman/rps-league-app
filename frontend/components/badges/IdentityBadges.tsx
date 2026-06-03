'use client'

import { LinkedInBadge } from './LinkedInBadge'
import { AchievementBadge } from './AchievementBadge'
import { BadgeData } from '@/types/rps'

interface IdentityBadgesProps {
  linkedinUrl?: string | null
  showLinkedinBadge?: boolean
  size?: 'sm' | 'md'
  badges?: BadgeData[]
  targetShortId?: string
}

export const IdentityBadges = ({
  linkedinUrl,
  showLinkedinBadge,
  size = 'md',
  badges = [],
  targetShortId
}: IdentityBadgesProps) => {
  const isSmall = size === 'sm'
  const isDev = targetShortId === 'Hqo7qUSe38'

  const maxAchievements = showLinkedinBadge ? 4 : 5

  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 ${isSmall ? 'mt-1' : 'mt-2'}`}
    >
      {isDev && (
        <span
          className={`relative isolate inline-flex items-center justify-center font-black uppercase tracking-tight text-white rounded-md shadow-[0_0_3px_rgba(168,85,247,0.6)] overflow-hidden animate-[holy-bloom_5s_linear_infinite] 
          ${isSmall ? 'text-[8px] px-1.5 h-4 leading-3.25' : 'text-[10px] px-2 h-5 leading-5'}`}
        >
          <div className="absolute inset-0 bg-linear-to-r from-purple-600 via-pink-600 to-orange-500 -z-10 animate-[shimmer_2s_linear_infinite] brightness-125" />
          <span className="relative z-10 text-white drop-shadow-md">Dev</span>
        </span>
      )}

      {linkedinUrl && showLinkedinBadge && (
        <div className="flex shrink-0">
          <LinkedInBadge url={linkedinUrl} size={size} />
        </div>
      )}

      {badges.slice(0, maxAchievements).map((badge) => (
        <AchievementBadge
          key={badge.code}
          badge={badge}
          size={isSmall ? 'xs' : 'sm'}
        />
      ))}
    </div>
  )
}
