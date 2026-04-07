import Link from 'next/link'
import type { PlayerStats } from '@/types/rps'

interface LeaderboardTableProps {
  stats: PlayerStats[]
}

const LeaderboardTable = ({ stats }: LeaderboardTableProps) => {
  if (stats.length === 0) {
    return (
      <p className="text-center text-gray-400 py-12">
        No matches found for this period.
      </p>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden w-full">
      <table className="w-full text-sm border-collapse min-[500px]:table-fixed">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="text-left px-3 py-4 text-gray-400 font-bold text-[10px] uppercase w-10 min-[500px]:w-[10%]">
              #
            </th>
            <th className="text-left px-2 py-4 text-gray-400 font-bold text-[10px] uppercase min-[500px]:w-[30%]">
              Player
            </th>
            <th className="hidden min-[500px]:table-cell px-3 py-4 text-right text-gray-400 font-bold text-[10px] uppercase min-[500px]:w-[20%]">
              W
            </th>
            <th className="hidden min-[500px]:table-cell px-3 py-4 text-right text-gray-400 font-bold text-[10px] uppercase min-[500px]:w-[20%]">
              L
            </th>
            <th className="hidden min-[500px]:table-cell px-3 py-4 text-right text-gray-400 font-bold text-[10px] uppercase min-[500px]:w-[20%]">
              Win%
            </th>
          </tr>
        </thead>
        <tbody>
          {stats.map((entry, index) => {
            const totalGames = entry.wins + entry.losses
            const winRate =
              totalGames > 0 ? Math.round((entry.wins / totalGames) * 100) : 0

            return (
              <tr
                key={entry.name || index}
                className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors"
              >
                <td className="px-3 py-4 text-gray-400 font-bold text-xs">
                  {index === 0 ? '🏆' : index + 1}
                </td>
                <td className="px-2 py-4">
                  <div className="flex flex-col">
                    <Link
                      href={`/player/${encodeURIComponent(entry.name)}`}
                      className="font-bold text-gray-900 hover:text-indigo-600 transition whitespace-nowrap"
                    >
                      {entry.name}
                    </Link>

                    <div className="flex min-[500px]:hidden mt-1.5 gap-3 text-[10px] font-bold uppercase">
                      <span className="text-green-600">W {entry.wins}</span>
                      <span className="text-red-500">L {entry.losses}</span>
                      <span className="text-indigo-500">{winRate}%</span>
                    </div>
                  </div>
                </td>
                <td className="hidden min-[500px]:table-cell px-3 py-4 text-right text-green-600 font-bold tabular-nums">
                  {entry.wins}
                </td>
                <td className="hidden min-[500px]:table-cell px-3 py-4 text-right text-red-500 font-bold tabular-nums">
                  {entry.losses}
                </td>
                <td className="hidden min-[500px]:table-cell px-3 py-4 text-right text-indigo-500 font-bold tabular-nums">
                  {winRate}%
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default LeaderboardTable
