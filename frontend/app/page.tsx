'use client'

const HomePage = () => {
  return (
    <div className="flex flex-col items-center w-full">
      <h1 className="text-3xl font-bold text-gray-900 mb-4 text-center">Welcome to RPS League</h1>
      <p className="text-gray-600 text-center">
        Explore the latest matches, check leaderboards, and track player performance.
      </p>

      <div className="mt-8 w-full bg-white shadow rounded-lg p-6 text-center text-gray-500">
        Match list / leaderboard will appear here
      </div>

      <div className="mt-6 flex justify-center gap-4 text-white font-bold">
        <span className="bg-green-500 px-3 py-1 rounded">WIN</span>
        <span className="bg-red-500 px-3 py-1 rounded">LOSE</span>
        <span className="bg-orange-400 px-3 py-1 rounded">TIE</span>
      </div>
    </div>
  )
}

export default HomePage