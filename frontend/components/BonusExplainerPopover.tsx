import { useState } from 'react'

export default function BonusExplainerPopover() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative flex items-center">
      <div
        className="cursor-pointer select-none flex items-center gap-1.5"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="text-red-500">LOSE: -50%</span>
        <span className="bg-gray-100 hover:bg-gray-200 text-purple-600 text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-md transition-colors tracking-tighter">
          BONUS INFO
        </span>
      </div>

      {open && (
        <div className="absolute top-full -right-1 mt-3 z-50 p-3 bg-white border border-gray-100 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 w-56 sm:w-64">
          <div className="flex flex-col gap-3">
            {/* Tiered bonuses */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-black text-purple-600 uppercase tracking-wider">
                Bonus System Active
              </span>
              <p className="text-[10px] leading-relaxed text-gray-500 font-medium break-normal">
                40% chance per match to trigger a{' '}
                <span className="text-gray-800 font-bold whitespace-normal">
                  Tiered Bonus
                </span>
                :
              </p>
              <ul className="text-[9px] text-gray-600 space-y-1 list-disc pl-3">
                <li>
                  <span className="text-green-600 font-bold">
                    +50% to 500%
                  </span>{' '}
                  gain on Win
                </li>
                <li>
                  <span className="text-blue-600 font-bold">
                    10% to 100% fewer
                  </span>{' '}
                  points lost on Loss
                </li>
                <li>Bad luck protection: 4th bet guaranteed</li>
              </ul>
            </div>

            {/* Win streaks */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-100">
              <span className="text-[10px] font-black text-orange-600 uppercase tracking-wider">
                Win Streaks
              </span>
              <ul className="text-[9px] text-gray-600 space-y-1 list-disc pl-3">
                <li>
                  <span className="font-bold text-gray-800">2x / 3x / 5x</span>{' '}
                  multiplier
                </li>
                <li>
                  Triggers at{' '}
                  <span className="font-bold text-gray-800">3 / 4 / 5+</span>{' '}
                  wins
                </li>
              </ul>
            </div>

            {/* Flash events */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider">
                  Flash Events
                </span>
                <span className="text-[9px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                  5% Chance
                </span>
              </div>
              <p className="text-[9px] text-gray-500 font-medium italic">
                Lasts 3 rounds • Guaranteed Wins • Theme Shift
              </p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 mt-1">
                <div className="flex items-center gap-1">
                  <span className="text-[10px]">🌙</span>
                  <span className="text-[9px] font-bold text-gray-700">
                    Moon
                  </span>
                  <span className="text-[8px] text-gray-400 font-medium">
                    x3
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px]">⚡</span>
                  <span className="text-[9px] font-bold text-gray-700">
                    Electric
                  </span>
                  <span className="text-[8px] text-gray-400 font-medium">
                    x3
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px]">🃏</span>
                  <span className="text-[9px] font-bold text-gray-700">
                    Luck
                  </span>
                  <span className="text-[7px] leading-none bg-amber-100 text-amber-700 px-1 py-0.5 rounded-sm font-black uppercase tracking-tighter border border-amber-200">
                    x1.5 + Leg Bns
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px]">🔥</span>
                  <span className="text-[9px] font-bold text-gray-700">
                    Hellfire
                  </span>
                  <span className="text-[8px] text-gray-400 font-medium">
                    x3
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
