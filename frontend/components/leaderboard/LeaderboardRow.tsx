import Link from 'next/link'
import GemIcon from '@/components/icons/GemIcon'
import { IdentityBadges } from '@/components/badges/IdentityBadges'
import { formatPoints, getAmountColor, getDisplayTierClass } from '@/lib/format'
import { BadgeData, LeaderboardEntry } from '@/types/rps'
import { Tab, isLapsTab, isAchievementsTab } from './constants'

interface LeaderboardRowProps {
  entry: LeaderboardEntry
  index: number
  tab: Tab
  isMe: boolean
  myBadges: BadgeData[]
  myStoreShowLinkedin: boolean
  badgeMap: Record<string, BadgeData[]>
}

export function LeaderboardRow({
  entry,
  index,
  tab,
  isMe,
  myBadges,
  myStoreShowLinkedin,
  badgeMap
}: LeaderboardRowProps) {
  const gainedBI = BigInt(entry.gained ?? '0')
  const entryBadges = isMe ? myBadges : badgeMap[entry.shortId] || []
  const hasRainbow = entryBadges.some((b) => b.rarity === 'RAINBOW')
  const hasMythical =
    !hasRainbow && entryBadges.some((b) => b.rarity === 'MYTHICAL')
  const prestigeClass = hasRainbow
    ? 'row-prestige-rainbow'
    : hasMythical
      ? 'row-prestige-mythical'
      : ''

  return (
    <tr
      key={entry.userId}
      className={`transition-all duration-700 relative ${
        prestigeClass ? prestigeClass : isMe ? 'bg-purple-50' : 'bg-white'
      }`}
    >
      <td className="px-2 py-3 align-top text-gray-400 font-bold text-xs w-12 whitespace-nowrap bg-transparent">
        {index === 0 ? '🏆' : index + 1}
      </td>

      <td className="px-1 min-[600px]:px-3 py-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Link
              href={`/profile/${entry.shortId}`}
              className={`font-black transition hover:underline decoration-purple-400 underline-offset-4 ${
                isMe ? 'text-purple-600' : 'text-gray-900'
              }`}
            >
              {entry.nickname ?? entry.userId.slice(0, 8)}
            </Link>
            {isMe && (
              <span className="text-[9px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-black uppercase">
                YOU
              </span>
            )}
          </div>

          <IdentityBadges
            linkedinUrl={entry.linkedinUrl}
            showLinkedinBadge={
              isMe ? myStoreShowLinkedin : entry.showLinkedinBadge
            }
            badges={isMe ? myBadges : badgeMap[entry.shortId] || []}
            size="sm"
            targetShortId={entry.shortId}
          />

          {/* Mobile stats row */}
          <div className="flex flex-col min-[600px]:hidden mt-3 gap-0.5 text-[10px]">
            {isLapsTab(tab) ? (
              <>
                <div className="flex gap-2 text-gray-400 font-bold uppercase tracking-wider">
                  <div className="w-10">Laps</div>
                  {tab === 'speedrun' && <div className="w-16">Fastest</div>}
                  <div className="w-14">Pts</div>
                  <div className="w-14">Peak</div>
                </div>
                <div className="flex gap-2 font-medium items-center">
                  <div className="w-10 text-indigo-600 font-black">
                    {entry.laps ?? 0}
                  </div>
                  {tab === 'speedrun' && (
                    <div className="w-16 text-gray-600 font-bold">
                      {entry.fastestLapBets != null
                        ? `${entry.fastestLapBets}b`
                        : '-'}
                    </div>
                  )}
                  <div
                    className={`w-14 font-bold ${getDisplayTierClass(entry.points, entry.pointStylePreference)} `}
                    data-text={formatPoints(entry.points).display}
                  >
                    {formatPoints(entry.points).display}
                  </div>
                  <div
                    className={`w-14 font-bold ${getAmountColor(entry.peakPoints)}`}
                  >
                    {formatPoints(entry.peakPoints).display}
                  </div>
                </div>
              </>
            ) : isAchievementsTab(tab) ? (
              <div className="flex gap-2 font-medium items-center mt-1 text-[10px]">
                <span className="text-indigo-600 font-black">
                  {entry.achievementCount ?? 0}
                </span>
                <span className="text-gray-400 font-bold uppercase tracking-wider">
                  achievements
                </span>
              </div>
            ) : (
              <>
                <div className="flex gap-2 text-gray-400 font-bold uppercase tracking-wider">
                  <div className="w-6">W</div>
                  <div className="w-6">L</div>
                  <div className="w-14">Pts</div>
                  <div className="w-14">Gain</div>
                  <div className="w-14">Peak</div>
                </div>
                <div className="flex gap-2 font-medium items-center">
                  <div className="w-6 text-green-600 font-bold">
                    {entry.wins}
                  </div>
                  <div className="w-6 text-red-500 font-bold">
                    {entry.losses}
                  </div>
                  <div className="w-14 font-bold flex items-center gap-0.5">
                    <GemIcon size={8} className="shrink-0 text-gray-400" />
                    <span
                      className={getDisplayTierClass(
                        entry.points,
                        entry.pointStylePreference
                      )}
                      data-text={formatPoints(entry.points).display}
                    >
                      {formatPoints(entry.points).display}
                    </span>
                  </div>
                  <div
                    className={`w-14 font-bold ${gainedBI >= 0n ? 'text-green-500' : 'text-red-500'}`}
                  >
                    {gainedBI >= 0n ? '+' : ''}
                    {formatPoints(entry.gained ?? '0').display}
                  </div>
                  <div
                    className={`w-14 font-bold ${getAmountColor(entry.peakPoints)}`}
                  >
                    {formatPoints(entry.peakPoints).display}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </td>

      {/* Desktop cells */}
      {isLapsTab(tab) ? (
        <>
          <td className="hidden min-[600px]:table-cell px-3 py-3 text-center font-black text-indigo-600">
            {entry.laps ?? 0}
          </td>
          {tab === 'speedrun' && (
            <td className="hidden min-[600px]:table-cell px-3 py-3 text-center font-bold text-gray-600">
              {entry.fastestLapBets != null
                ? `${entry.fastestLapBets} bets`
                : '-'}
            </td>
          )}
          <td className="hidden min-[600px]:table-cell px-3 py-3 text-right font-bold">
            <span
              className={getDisplayTierClass(
                entry.points,
                entry.pointStylePreference
              )}
              data-text={formatPoints(entry.points).display}
            >
              {formatPoints(entry.points).display}
            </span>
          </td>
          <td className="hidden min-[600px]:table-cell px-3 py-3 text-right font-bold">
            <span className={getAmountColor(entry.peakPoints)}>
              {formatPoints(entry.peakPoints).display}
            </span>
          </td>
        </>
      ) : isAchievementsTab(tab) ? (
        <td className="hidden min-[600px]:table-cell px-3 py-3 text-right font-black text-indigo-600">
          {entry.achievementCount ?? 0}
        </td>
      ) : (
        <>
          <td className="hidden min-[600px]:table-cell px-3 py-3 text-center text-green-600 font-bold">
            {entry.wins}
          </td>
          <td className="hidden min-[600px]:table-cell px-3 py-3 text-center text-red-500">
            {entry.losses}
          </td>
          <td className="hidden min-[680px]:table-cell px-3 py-3 text-center text-indigo-500 font-bold">
            {entry.winRate}%
          </td>
          <td className="hidden min-[600px]:table-cell px-3 py-3 text-right font-bold">
            <span
              className={getDisplayTierClass(
                entry.points,
                entry.pointStylePreference
              )}
              data-text={formatPoints(entry.points).display}
            >
              {formatPoints(entry.points).display}
            </span>
          </td>
          <td className="hidden min-[600px]:table-cell px-3 py-3 text-right font-bold">
            <span
              className={gainedBI >= 0n ? 'text-green-600' : 'text-red-500'}
            >
              {gainedBI >= 0n ? '+' : ''}
              {formatPoints(entry.gained ?? '0').display}
            </span>
          </td>
          <td className="hidden min-[600px]:table-cell px-3 py-3 text-right font-bold">
            <span className={getAmountColor(entry.peakPoints)}>
              {formatPoints(entry.peakPoints).display}
            </span>
          </td>
        </>
      )}
    </tr>
  )
}
