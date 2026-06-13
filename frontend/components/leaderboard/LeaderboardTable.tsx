import { BadgeData, LeaderboardEntry } from '@/types/rps'
import {
  Tab,
  SortKey,
  SortDir,
  isLapsTab,
  isAchievementsTab,
  EMPTY_MESSAGES
} from './constants'
import { SortArrow } from './SortArrow'
import { LeaderboardRow } from './LeaderboardRow'

interface LeaderboardTableProps {
  data: LeaderboardEntry[]
  isLoading: boolean
  tab: Tab
  sort: SortKey
  dir: SortDir
  onSort: (col: SortKey) => void
  myShortId: string | null
  myBadges: BadgeData[]
  myStoreShowLinkedin: boolean
  badgeMap: Record<string, BadgeData[]>
}

export function LeaderboardTable({
  data,
  isLoading,
  tab,
  sort,
  dir,
  onSort,
  myShortId,
  myBadges,
  myStoreShowLinkedin,
  badgeMap
}: LeaderboardTableProps) {
  const th = (
    label: string,
    col: SortKey,
    align = 'text-right',
    extraClasses = ''
  ) => (
    <th
      className={`px-3 py-3 font-bold text-xs uppercase tracking-wide cursor-pointer select-none ${align} ${sort === col ? 'text-purple-600' : 'text-gray-400'} hover:text-purple-500 transition ${extraClasses}`}
      onClick={() => onSort(col)}
    >
      {label}
      <SortArrow active={sort === col} dir={dir} />
    </th>
  )

  if (isLoading) {
    return <p className="text-center text-gray-400 py-12">Loading...</p>
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="text-left px-2 py-3 text-gray-400 font-bold text-xs uppercase w-12 whitespace-nowrap">
              #
            </th>
            <th className="text-left px-3 py-3 text-gray-400 font-bold text-xs uppercase">
              Player
            </th>

            {isLapsTab(tab) ? (
              <>
                {th(
                  'Laps',
                  'laps',
                  'text-center',
                  'hidden min-[600px]:table-cell'
                )}
                {tab === 'speedrun' &&
                  th(
                    'Fastest Lap',
                    'fastest',
                    'text-center',
                    'hidden min-[600px]:table-cell'
                  )}
                {th(
                  'Points',
                  'points',
                  'text-right',
                  'hidden min-[600px]:table-cell'
                )}
                {th(
                  'Peak',
                  'peak',
                  'text-right',
                  'hidden min-[600px]:table-cell'
                )}
              </>
            ) : isAchievementsTab(tab) ? (
              <th className="px-3 py-3 text-right text-gray-400 font-bold text-xs uppercase hidden min-[600px]:table-cell">
                Achievements
              </th>
            ) : (
              <>
                {th(
                  'W',
                  'wins',
                  'text-center',
                  'hidden min-[600px]:table-cell'
                )}
                {th(
                  'L',
                  'losses',
                  'text-center',
                  'hidden min-[600px]:table-cell'
                )}
                {th(
                  'Win%',
                  'winrate',
                  'text-center',
                  'hidden min-[680px]:table-cell'
                )}
                {th(
                  'Points',
                  'points',
                  'text-right',
                  'hidden min-[600px]:table-cell'
                )}
                {th(
                  'Gained',
                  'gained',
                  'text-right',
                  'hidden min-[600px]:table-cell'
                )}
                {th(
                  tab === 'daily'
                    ? 'Daily Peak'
                    : tab === 'weekly'
                      ? 'Weekly Peak'
                      : 'All Time Peak',
                  'peak',
                  'text-right',
                  'hidden min-[600px]:table-cell'
                )}
              </>
            )}
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-20 px-4 text-center">
                <p className="text-gray-500 font-medium italic">
                  {EMPTY_MESSAGES[tab]}
                </p>
              </td>
            </tr>
          ) : (
            data.map((entry, index) => (
              <LeaderboardRow
                key={entry.userId}
                entry={entry}
                index={index}
                tab={tab}
                isMe={entry.shortId === myShortId}
                myBadges={myBadges}
                myStoreShowLinkedin={myStoreShowLinkedin}
                badgeMap={badgeMap}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
