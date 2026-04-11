import { LinkedInBadge } from "./LinkedInBadge"

interface IdentityBadgesProps {
  targetShortId: string
  linkedinUrl?: string | null
  isOwnProfile?: boolean
  showLinkedinBadge?: boolean
  size?: 'sm' | 'md' // Optional size toggle
}

export const IdentityBadges = ({
  targetShortId,
  linkedinUrl,
  isOwnProfile,
  showLinkedinBadge,
  size = 'md'
}: IdentityBadgesProps) => {
  const isDev = targetShortId === 'Hqo7qUSe38'
  const isSmall = size === 'sm'

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${isSmall ? 'mt-0.5' : 'mt-1.5'}`}
    >
      {/* Dev badge */}
      {isDev && (
        <span
          className={`relative isolate inline-flex items-center justify-center font-black uppercase tracking-tight text-white rounded-md shadow-[0_0_20px_rgba(168,85,247,0.6)] overflow-hidden animate-[holy-bloom_5s_linear_infinite] 
          ${isSmall ? 'px-1.5 py-0.5 text-[9px]' : 'px-3 py-1 text-[12px]'}`}
        >
          <div className="absolute inset-0 bg-linear-to-r from-purple-600 via-pink-600 to-orange-500 -z-10 animate-[shimmer_2s_linear_infinite] brightness-125" />
          <span className="relative z-10 text-white drop-shadow-md">Dev</span>
        </span>
      )}
      {/* LinkedIn badge */}
      {linkedinUrl && (!isOwnProfile || showLinkedinBadge) && (
        <div className="flex shrink-0">
          <LinkedInBadge url={linkedinUrl} size={size} />
        </div>
      )}
    </div>
  )
}
