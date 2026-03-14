import Link from 'next/link'
import type { PlayerStats } from '@/types/rps'

interface LeaderboardTableProps {
  stats: PlayerStats[]
}

const LeaderboardTable = ({ stats }: LeaderboardTableProps) => {
  if (stats.length === 0)
    return (
      <p className="text-center text-gray-400 py-12">
        No matches found for this period
      </p>
    )

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="text-left px-4 py-3 text-gray-500 font-medium w-10">
              #
            </th>
            <th className="text-left px-4 py-3 text-gray-500 font-medium">
              Player
            </th>
            <th className="text-center px-4 py-3 text-green-600 font-medium">
              W
            </th>
            <th className="text-center px-4 py-3 text-red-500 font-medium">
              L
            </th>
            <th className="text-center px-4 py-3 text-orange-400 font-medium">
              T
            </th>
            <th className="text-center px-4 py-3 text-indigo-500 font-medium">
              Win%
            </th>
          </tr>
        </thead>
        <tbody>
          {stats.map((player, index) => (
            <tr
              key={player.name}
              className={`border-b border-gray-50 ${index === 0 ? 'bg-yellow-50' : ''}`}
            >
              <td className="px-4 py-3 text-gray-400 font-medium">
                {index === 0 ? '🏆' : index + 1}
              </td>
              <td className="px-4 py-3 font-medium">
                <Link
                  href={`/player/${encodeURIComponent(player.name)}`}
                  className="text-gray-800 underline decoration-gray-300 hover:decoration-indigo-600 hover:text-indigo-600 transition"
                >
                  {player.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-center text-green-600 font-bold">
                {player.wins}
              </td>
              <td className="px-4 py-3 text-center text-red-500">
                {player.losses}
              </td>
              <td className="px-4 py-3 text-center text-orange-400">
                {player.ties}
              </td>
              <td className="px-4 py-3 text-center text-indigo-500 font-medium">
                {player.winRate}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default LeaderboardTable
