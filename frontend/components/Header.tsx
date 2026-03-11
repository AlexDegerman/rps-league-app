'use client'

const Header = () => {
  return (
    <header className="flex justify-center gap-4 bg-white shadow p-4 ">
      <button className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-yellow-400 hover:text-gray-900 transition">
        Newest
      </button>
      <button className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-yellow-400 hover:text-gray-900 transition">
        Leaderboard
      </button>
      <button className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-yellow-400 hover:text-gray-900 transition">
        Historical
      </button>
    </header>
  )
}

export default Header