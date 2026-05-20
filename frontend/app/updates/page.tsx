'use client'

import { useState, useEffect, useRef } from 'react'

type Update = {
  version: string
  label: string
  notes: string[]
}

const UPDATES: Update[] = [
  {
    version: '1.8',
    label: 'Daily Oracle & Point Style Customization',
    notes: [
      'Daily Oracle Prophecy: A server-side AI analyst now issues one guaranteed prediction per day. The Oracle picks a side before the match and rigs the outcome in your favor, follow it and win. The prophecy resets at midnight UTC.',
      'Tamper-Proof Oracle: Oracle usage is tracked server-side in the database, not localStorage. Clearing browser data does not grant additional uses. One prophecy per player per day, enforced at the prediction layer.',
      "Oracle Glow: The pending match card highlights the Oracle's predicted side with a distinctive purple pulse animation, making the recommended bet visually unmistakable.",
      'Point Style Customization: Players can now pin a preferred visual style for their point display from their profile page. 32 tiers available from Million to Octovigintillion, unlocked by reaching the corresponding all-time peak threshold. Cosmetic only.',
      'Auto-Style Mode: Enabled by default. Automatically advances your display to the highest tier you have reached. Can be overridden at any time by selecting a specific style manually.',
      'All-Time Peak Tracking: Introduced a permanent all_time_peak column that is never reset by daily or weekly cycles, used as the authoritative source for style unlock eligibility.'
    ]
  },
  {
    version: '1.7',
    label: 'Observability and Feedback Portal',
    notes: [
      'Engine Stability: Deployed real-time crash monitoring to ensure your win streaks are never interrupted by technical failures.',
      'Feedback Portal: Report bugs or suggestions directly from the game. Reports now automatically include your game state (points, streak, active events) for faster resolution.',
      'Session Persistence: Improved connection health monitoring for the live match stream, reducing "stuck" states during high-volume periods.',
      'Instant Alerts: Developers are now notified the moment a critical issue occurs, allowing for rapid hotfixes without taking the league offline.',
      'Spam Protection: Implemented a new security layer to protect the integrity of the feedback pipeline and leaderboard stats.'
    ]
  },
  {
    version: '1.6',
    label: 'Flash Event: Hellfire',
    notes: [
      'The Season 1 Finale: A high-intensity pressure state that transforms the arena into a heat-drenched crimson landscape.',
      'Effect: All predictions are guaranteed wins with a massive 5x win multiplier active for the duration.',
      'Visual Overhaul: Standard effects replaced with rising flame columns, flying embers, and persistent heat shimmer.',
      'Fire audio feedback reinforces every high-pressure prediction.',
      'Prestige Tiers: Added Octovigintillion (Lava Overload) with wandering magma-flows and Septenvigintillion (Molten) featuring heat-haze distortion.'
    ]
  },
  {
    version: '1.5',
    label: 'Flash Event: Luck in the Card',
    notes: [
      'High-Roller Casino Theme: A premium event styled in rich gold and amber tones for the league’s biggest whales.',
      'Effect: All predictions are guaranteed wins + Legendary Bonus (10x reward) guaranteed on every match.',
      'Jackpot Visuals: Win confetti replaced with cascading card suits, gold particle bursts, and shimmer trails.',
      'Prestige Tiers: Introduced Sexvigintillion (The Jackpot) with orbiting dice satellites and Quinvigintillion (Holographic Foil) with 7-stop oil-slick rainbow gradients.',
      'Documentation: Fully updated the global BigInt engine documentation to cover point scaling beyond the Septvigintillions.'
    ]
  },
  {
    version: '1.4',
    label: 'Flash Event: Electric Surge',
    notes: [
      'Digital Storm Aesthetic: A volatile energy theme featuring neon violet and electric purple UI shifts.',
      'Effect: All predictions are guaranteed wins with a 5x win multiplier active.',
      'Dynamic Effects: Standard win confetti replaced with high-speed electric static rain and lightning audio feedback.',
      'Prestige Tiers: Added Quattuorvigintillion (Supercell) with fractal lightning spokes and Trevigintillion (Charged) featuring neon flicker sequences.'
    ]
  },
  {
    version: '1.3',
    label: "Flash Event: Moon's Blessing",
    notes: [
      'Flash Event System: Introduced live gameplay modifiers with a 5% trigger chance, active for 3 predictions.',
      "Moon's Blessing: A serene, lunar-inspired event that wraps the arena in cool blue and moonlight tones.",
      'Effect: All predictions are guaranteed wins with a 5x win multiplier active.',
      'Celestial Tiers: Introduced Duovigintillion (Full Eclipse) with crawling lunar surface textures and Unvigintillion (Moonlit) featuring navy-to-white sweeps.',
      'Lunar Motifs: Icons and UI elements adapt to crescent-inspired styling during the event.'
    ]
  },
  {
    version: '1.2',
    label: 'Fever Time: Win Streak Multipliers',
    notes: [
      'Streak Multipliers: Chain consecutive wins to activate escalating rewards: 3 wins (3x), 4 wins (6x), 5 wins (10x).',
      'Ceiling Persistence: The 10x multiplier remains active until your win streak is broken.',
      'Visual Momentum: The entire UI shifts color in real-time based on your streak. Colors shift from calm greens to intense reds at the 10x cap.',
      'Persistent Records: Longest Win Streak is now a permanent stat tracked in your global profile.',
      'Streak Badging: New dynamic badges added to the prediction screen that intensify visually as your streak grows.'
    ]
  },
  {
    version: '1.1',
    label: 'Social Profiles and Player Identity',
    notes: [
      'Global Profiles: Every user now has a unique, shareable URL displaying bet history, biggest wins, and highest multipliers.',
      'Competitive Inspecting: Click any player on the leaderboard to view their full performance stats and historical data.',
      'LinkedIn Integration: Add your professional profile to display a verified badge next to your name in the league.',
      'Nickname Diversity: Greatly expanded the random identity generator for more unique player names across the platform.',
      'UI Improvements: Daily rank and nickname are now visible directly on the homepage for faster tracking.'
    ]
  },
  {
    version: '1.0',
    label: 'League Launch',
    notes: [
      'The Oracle: Introduced a Gemini-powered AI competitive analyst. Ask about move heat maps, house edge, or player dominance in real-time.',
      'Zero-Friction Identity: Start with 200,000 points instantly with no registration or login required.',
      'High-Frequency Simulation: A live-service engine delivering over 17,000 matches per day via low-latency streams.',
      'Vigintillion Scale: Custom-built architecture supporting scores into the Vigintillions. Your points will never outgrow the engine.',
      'Dynamic Economy: Multipliers of +100% on wins and -50% on losses, with tiered bonus events (COMMON to LEGENDARY).',
      'Pity Mechanic: Internal luck protection guarantees a bonus event trigger at least once every 4 matches.',
      'Global Rankings: Full predictor leaderboard featuring Daily, Weekly, and All-Time competitive tabs.'
    ]
  }
]

type SortOrder = 'newest' | 'oldest'

export default function UpdatesPage() {
  const [openVersion, setOpenVersion] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  const containerRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const sorted = sortOrder === 'newest' ? UPDATES : [...UPDATES].reverse()
  const newestVersion = UPDATES[0].version

  useEffect(() => {
    if (openVersion) {
      setTimeout(() => {
        containerRefs.current[openVersion]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        })
      }, 100)
    }
  }, [openVersion])

  const toggle = (version: string) => {
    setOpenVersion((prev) => (prev === version ? null : version))
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="min-w-0">
          {/* whitespace-nowrap and responsive font sizes to prevent wrapping */}
          <h1 className="text-base sm:text-lg font-black text-gray-900 uppercase tracking-wider sm:tracking-widest whitespace-nowrap">
            Update History
          </h1>
          <p className="text-[10px] sm:text-[11px] text-gray-400 font-medium mt-0.5 uppercase tracking-wide">
            {UPDATES.length} updates
          </p>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 shrink-0">
          {(['newest', 'oldest'] as const).map((order) => (
            <button
              key={order}
              type="button"
              onClick={() => setSortOrder(order)}
              className={`text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-md transition-colors ${
                sortOrder === order
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {order}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {sorted.map((update) => {
          const isOpen = openVersion === update.version
          const isNewest = update.version === newestVersion

          return (
            <div
              key={update.version}
              ref={(el) => {
                containerRefs.current[update.version] = el
              }}
              className={`bg-white rounded-xl border shadow-sm transition-all duration-200 overflow-hidden scroll-mt-20 ${
                isNewest
                  ? 'border-green-300 ring-1 ring-green-50'
                  : isOpen
                    ? 'border-indigo-200'
                    : 'border-gray-100'
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(update.version)}
                className="w-full flex items-start gap-3 px-4 py-4 text-left"
              >
                <span
                  className={`shrink-0 w-11 text-center text-[10px] font-black uppercase tracking-widest py-1 rounded-md transition-colors mt-0.5 ${
                    isNewest
                      ? 'bg-green-500 text-white'
                      : isOpen
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  v{update.version}
                </span>

                <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-gray-800 leading-tight whitespace-normal">
                    {update.label}
                  </span>

                  {isNewest && (
                    <span className="self-start sm:self-auto shrink-0 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      Latest
                    </span>
                  )}
                </div>

                <svg
                  className={`shrink-0 w-4 h-4 text-gray-400 mt-1 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isOpen && (
                <div className="px-4 pb-5 border-t border-gray-50 pt-4 animate-in fade-in slide-in-from-top-1 duration-200 bg-gray-50/30">
                  <ul className="flex flex-col gap-3">
                    {update.notes.map((note, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        <p className="text-[12px] text-gray-600 font-medium leading-relaxed">
                          {note}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
