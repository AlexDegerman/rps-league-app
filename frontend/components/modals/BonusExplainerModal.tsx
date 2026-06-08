'use client'

import React, { useState } from 'react'
import Link from 'next/link'

interface ExpandedState {
  bonuses: boolean
  streaks: boolean
  flash: boolean
  relics: boolean
  festivals: boolean
}

interface AccordionSectionProps {
  title: string
  color: string
  dotColor: string
  children: React.ReactNode
  isOpen: boolean
  onClick: () => void
  badge?: string
  badgeColor?: string
}

// --- MAIN COMPONENT ---

export default function BonusExplainerModal({
  onClose
}: {
  onClose: () => void
}) {
  const [expanded, setExpanded] = useState<ExpandedState>({
    bonuses: true,
    streaks: false,
    flash: false,
    relics: false,
    festivals: false
  })

  const toggleSection = (section: keyof ExpandedState) => {
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  return (
    <>
      {/* MODAL */}
      <div className="fixed inset-x-0 top-0 bottom-14 z-100 flex items-center justify-center px-4 h-[calc(100svh-56px)]">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className="relative w-full max-w-sm animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden max-h-[78svh] flex flex-col">
            {/* Accent bar */}
            <div className="h-1.5 w-full bg-linear-to-r from-purple-400 via-blue-500 to-cyan-400 shrink-0" />

            {/* Header */}
            <div className="px-5 pt-4 pb-3 shrink-0 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-900">
                    Game Systems
                  </h2>
                  <span className="text-[8px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase tracking-wide">
                    Manual
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
                >
                  <CloseIcon />
                </button>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 custom-scrollbar relative">
              {/* 1. BONUS SYSTEM */}
              <AccordionSection
                title="Bonus System"
                color="text-purple-600"
                dotColor="bg-purple-400"
                isOpen={expanded.bonuses}
                onClick={() => toggleSection('bonuses')}
                badge="40% per match"
                badgeColor="bg-purple-100 text-purple-700"
              >
                <div className="space-y-3">
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    Every prediction has a{' '}
                    <span className="text-gray-800 font-bold">40% chance</span>{' '}
                    to roll a tiered bonus (80% under 2M points). If no bonus
                    triggers for 3 consecutive matches, the 4th is{' '}
                    <span className="text-purple-600 font-bold underline decoration-purple-200">
                      guaranteed
                    </span>
                    . The <span className="font-bold text-gray-800">Cards</span>{' '}
                    flash event always produces a Legendary bonus on wins.
                  </p>

                  <div className="grid grid-cols-2 gap-1.5">
                    <BonusTierCard
                      name="Common"
                      color="text-gray-500"
                      bg="bg-gray-50 border-gray-200"
                      winText="1.5x - 2.2x win"
                      lossText="Save 10-25% of loss"
                      chance="~59.5%"
                    />
                    <BonusTierCard
                      name="Rare"
                      color="text-blue-500"
                      bg="bg-blue-50 border-blue-100"
                      winText="2.2x - 3.2x win"
                      lossText="Save 25-50% of loss"
                      chance="~25%"
                    />
                    <BonusTierCard
                      name="Epic"
                      color="text-purple-500"
                      bg="bg-purple-50 border-purple-100"
                      winText="3.2x - 4.2x win"
                      lossText="Save 60-90% of loss"
                      chance="~13%"
                    />
                    <BonusTierCard
                      name="Legendary"
                      color="text-yellow-600"
                      bg="bg-yellow-50 border-yellow-200"
                      winText="5.0x win"
                      lossText="Loss fully negated"
                      chance="~2%"
                    />
                  </div>

                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="text-[9px] font-black text-red-600 uppercase tracking-wider">
                        Mythical
                      </p>
                      <p className="text-[10px] font-bold text-red-700">
                        7x win · Loss fully negated
                      </p>
                      <p className="text-[9px] text-red-400 italic mt-0.5">
                        Primarily via Architect&apos;s Keystone relic
                      </p>
                    </div>
                    <span className="text-[8px] font-bold bg-red-100 text-red-600 px-1.5 py-1 rounded border border-red-200">
                      0.5%
                    </span>
                  </div>

                  <div className="text-[9px] text-gray-400 italic border-t border-gray-100 pt-2">
                    Precision Bearing relic adds +10% flat chance. Biased
                    Oscillator shifts the tier distribution toward
                    Epic/Legendary.
                  </div>
                </div>
              </AccordionSection>

              {/* 2. WIN STREAKS */}
              <AccordionSection
                title="Win Streaks"
                color="text-orange-600"
                dotColor="bg-orange-400"
                isOpen={expanded.streaks}
                onClick={() => toggleSection('streaks')}
              >
                <div className="space-y-3">
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    Consecutive wins unlock escalating multipliers applied on
                    top of your base payout. The UI color theme shifts in real
                    time and your streak badge evolves with each tier. Any loss
                    resets the multiplier to 1x.
                  </p>

                  <div className="space-y-1.5">
                    {[
                      {
                        wins: '3 wins',
                        mult: '2x',
                        label: 'Streak',
                        color: 'text-orange-500',
                        bg: 'bg-orange-50 border-orange-200'
                      },
                      {
                        wins: '4 wins',
                        mult: '3x',
                        label: 'Hot Streak',
                        color: 'text-red-500',
                        bg: 'bg-red-50 border-red-200'
                      },
                      {
                        wins: '5+ wins',
                        mult: '5x',
                        label: 'Inferno',
                        color: 'text-rose-600',
                        bg: 'bg-rose-50 border-rose-200'
                      }
                    ].map((tier) => (
                      <div
                        key={tier.wins}
                        className={`flex items-center justify-between p-2 rounded-lg border ${tier.bg}`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[11px] font-black ${tier.color}`}
                          >
                            {tier.mult}
                          </span>
                          <span className="text-[10px] font-bold text-gray-700">
                            {tier.label}
                          </span>
                          <span className="text-[9px] text-gray-400">
                            ({tier.wins})
                          </span>
                        </div>
                        <span className="text-[9px] text-gray-400 font-medium">
                          Applied on win
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="text-[9px] text-gray-400 italic border-t border-gray-100 pt-2">
                    Longest streak is permanently tracked on your profile. The
                    5x Inferno multiplier holds indefinitely until the streak
                    breaks. Fever Festival freezes streak resets for its
                    duration.
                  </p>
                </div>
              </AccordionSection>

              {/* 3. FLASH EVENTS */}
              <AccordionSection
                title="Flash Events"
                color="text-blue-600"
                dotColor="bg-blue-400"
                isOpen={expanded.flash}
                onClick={() => toggleSection('flash')}
                badge="5% per bet"
                badgeColor="bg-blue-100 text-blue-700"
              >
                <div className="space-y-3">
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    Personal events that trigger mid-match with a 5% chance per
                    bet. Last{' '}
                    <span className="font-bold text-gray-800">
                      3 predictions
                    </span>{' '}
                    with guaranteed 100% win rates, full UI theme overrides,
                    custom particles, and event-specific audio.
                  </p>

                  <div className="space-y-1.5">
                    <FlashEventRow
                      emoji="🌙"
                      name="Moon's Blessing"
                      color="text-blue-600"
                      bg="bg-blue-50 border-blue-100"
                      mult="3x"
                      desc="Calm lunar theme, cool blue tones, serene audio"
                    />
                    <FlashEventRow
                      emoji="⚡"
                      name="Electric Surge"
                      color="text-yellow-600"
                      bg="bg-yellow-50 border-yellow-100"
                      mult="3x"
                      desc="High-voltage sparks, electric storm effects"
                    />
                    <FlashEventRow
                      emoji="🃏"
                      name="Card's Fortune"
                      color="text-amber-700"
                      bg="bg-amber-50 border-amber-200"
                      mult="1.5x + Legendary bonus"
                      desc="Always triggers Legendary bonus on wins"
                      special
                    />
                    <FlashEventRow
                      emoji="🔥"
                      name="Hellfire"
                      color="text-red-600"
                      bg="bg-red-50 border-red-100"
                      mult="3x"
                      desc="Scorched UI, inferno particle systems"
                    />
                  </div>

                  <p className="text-[9px] text-gray-400 italic border-t border-gray-100 pt-2">
                    Cobalt Core relic boosts Flash Event chance by +25%.
                    Temporal Anchor relic extends duration by +1 round. Spark
                    Festival can grant all active players a Flash Event
                    simultaneously.
                  </p>
                </div>
              </AccordionSection>

              {/* 4. RELICS */}
              <AccordionSection
                title="Relic System"
                color="text-indigo-600"
                dotColor="bg-indigo-400"
                isOpen={expanded.relics}
                onClick={() => toggleSection('relics')}
                badge="Permanent"
                badgeColor="bg-indigo-100 text-indigo-700"
              >
                <div className="space-y-3">
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    Permanent collectible modifiers that drop after any
                    completed prediction. One active relic at a time. No
                    duplicates ever — each relic is a one-time acquisition that
                    permanently joins your collection.
                  </p>

                  <div className="grid grid-cols-5 gap-1.5 text-center">
                    {[
                      {
                        rarity: 'Common',
                        color: 'text-gray-600',
                        bg: 'bg-gray-50 border-gray-200',
                        base: '3%'
                      },
                      {
                        rarity: 'Rare',
                        color: 'text-blue-600',
                        bg: 'bg-blue-50 border-blue-200',
                        base: '1%'
                      },
                      {
                        rarity: 'Epic',
                        color: 'text-purple-600',
                        bg: 'bg-purple-50 border-purple-200',
                        base: '0.3%'
                      },
                      {
                        rarity: 'Legendary',
                        color: 'text-yellow-600',
                        bg: 'bg-yellow-50 border-yellow-200',
                        base: '0.1%'
                      },
                      {
                        rarity: 'Mythical',
                        color: 'text-red-600',
                        bg: 'bg-red-50 border-red-200',
                        base: '0.03%'
                      }
                    ].map((r) => (
                      <div
                        key={r.rarity}
                        className={`p-1.5 rounded-lg border ${r.bg}`}
                      >
                        <p
                          className={`text-[8px] font-black uppercase ${r.color}`}
                        >
                          {r.rarity}
                        </p>
                        <p className="text-[9px] font-bold text-gray-700 mt-0.5">
                          {r.base}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg space-y-1.5">
                    <p className="text-[10px] text-indigo-800 leading-relaxed">
                      Drop rates increase per Chrono-Lap completed. Effects
                      include Flash Event buffs, win multipliers, bonus tier
                      shifting, and streak protection. Anti-Swap Protocol
                      prevents mid-event relic swapping to maintain balance.
                    </p>
                    <Link
                      href="/relicshowcase"
                      onClick={onClose}
                      className="inline-flex items-center gap-1 text-[10px] text-indigo-600 font-black uppercase tracking-tight hover:underline"
                    >
                      View full Relic Catalogue <ExternalLinkIcon />
                    </Link>
                  </div>
                </div>
              </AccordionSection>

              {/* 5. PLAYER FESTIVALS */}
              <AccordionSection
                title="Player Festivals"
                color="text-cyan-600"
                dotColor="bg-cyan-400"
                isOpen={expanded.festivals}
                onClick={() => toggleSection('festivals')}
              >
                <div className="space-y-3">
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    Rare globally-triggered events that affect{' '}
                    <span className="font-bold text-gray-800">
                      every active player simultaneously
                    </span>
                    . Triggered by specific player milestones — streaks,
                    multipliers, relic discoveries, and Ascension completions.
                    Only one can be active at a time; a 5-minute cooldown
                    follows each.
                  </p>

                  <div className="space-y-1.5">
                    {[
                      {
                        name: 'Sanguine',
                        emoji: '🩸',
                        trigger: '4-loss streak',
                        effect: 'All bets resolve as wins for 3 matches',
                        color: 'text-red-600',
                        bg: 'bg-red-50 border-red-100'
                      },
                      {
                        name: 'Fever',
                        emoji: '🌡️',
                        trigger: '8-win streak (100%) / 5-win (20%)',
                        effect: 'Streak resets frozen for 6 matches',
                        color: 'text-orange-600',
                        bg: 'bg-orange-50 border-orange-100'
                      },
                      {
                        name: 'Ghost',
                        emoji: '👻',
                        trigger: '30x total multiplier (40%) / 60x (100%)',
                        effect: '+20% echo on all wins for 12 matches',
                        color: 'text-teal-600',
                        bg: 'bg-teal-50 border-teal-100'
                      },
                      {
                        name: 'Surge',
                        emoji: '⚡',
                        trigger: 'Chrono-Lap completion',
                        effect: '2x all win payouts for 6 matches',
                        color: 'text-cyan-600',
                        bg: 'bg-cyan-50 border-cyan-100'
                      },
                      {
                        name: 'Spark',
                        emoji: '✨',
                        trigger:
                          '2 Flash Events in a row / Leg. bonus during Flash',
                        effect: 'All players get 3-bet Flash Event instantly',
                        color: 'text-violet-600',
                        bg: 'bg-violet-50 border-violet-100'
                      },
                      {
                        name: 'Resonance',
                        emoji: '🔔',
                        trigger: '3 bonuses in a row (100%) / Leg. bonus (30%)',
                        effect: 'Every bet guaranteed Common or Rare bonus',
                        color: 'text-amber-600',
                        bg: 'bg-amber-50 border-amber-100'
                      },
                      {
                        name: 'Safeguard',
                        emoji: '🛡️',
                        trigger:
                          'Mythical (100%) or Legendary achievement (50%)',
                        effect: 'Loss deductions reduced to 40% for 12 matches',
                        color: 'text-slate-600',
                        bg: 'bg-slate-50 border-slate-200'
                      },
                      {
                        name: 'Vault',
                        emoji: '🔒',
                        trigger: 'Mythical relic discovery',
                        effect: 'Relic drop rates doubled for 24 matches',
                        color: 'text-blue-600',
                        bg: 'bg-blue-50 border-blue-100'
                      }
                    ].map((f) => (
                      <div
                        key={f.name}
                        className={`p-2 rounded-lg border ${f.bg} flex items-start gap-2`}
                      >
                        <span className="text-[13px] mt-0.5 shrink-0">
                          {f.emoji}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span
                              className={`text-[10px] font-black ${f.color}`}
                            >
                              {f.name}
                            </span>
                            <span className="text-[8px] text-gray-400 font-medium">
                              → {f.trigger}
                            </span>
                          </div>
                          <p className="text-[9px] text-gray-600 mt-0.5 font-medium">
                            {f.effect}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-2.5 bg-cyan-50 border border-cyan-100 rounded-lg space-y-1.5">
                    <p className="text-[9px] text-cyan-700 leading-relaxed">
                      The triggering player&apos;s name is broadcast globally
                      via the Oracle ticker. The Oracle also runs autonomous
                      weighted festivals every 18-24 min during low-activity
                      periods.
                    </p>
                    <Link
                      href="/festivalshowcase"
                      onClick={onClose}
                      className="inline-flex items-center gap-1 text-[10px] text-cyan-700 font-black uppercase tracking-tight hover:underline"
                    >
                      View All Festival Details <ExternalLinkIcon />
                    </Link>
                  </div>
                </div>
              </AccordionSection>

              <div className="h-8" />
            </div>

            {/* Fade gradient */}
            <div className="sticky bottom-0 left-0 right-0 h-10 bg-linear-to-t from-white to-transparent pointer-events-none shrink-0 -mt-10 z-10" />
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </>
  )
}

// --- SUB-COMPONENTS ---

function BonusTierCard({
  name,
  color,
  bg,
  winText,
  lossText,
  chance
}: {
  name: string
  color: string
  bg: string
  winText: string
  lossText: string
  chance: string
}) {
  return (
    <div className={`p-2 rounded-lg border ${bg}`}>
      <div className="flex items-center justify-between mb-1">
        <span
          className={`text-[9px] font-black uppercase tracking-wider ${color}`}
        >
          {name}
        </span>
        <span className="text-[7px] font-bold text-gray-400">{chance}</span>
      </div>
      <p className="text-[9px] font-bold text-green-600">{winText}</p>
      <p className="text-[9px] text-blue-500 italic">{lossText}</p>
    </div>
  )
}

function FlashEventRow({
  emoji,
  name,
  color,
  bg,
  mult,
  desc,
  special
}: {
  emoji: string
  name: string
  color: string
  bg: string
  mult: string
  desc: string
  special?: boolean
}) {
  return (
    <div className={`p-2 rounded-lg border ${bg} flex items-start gap-2`}>
      <span className="text-[14px] shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 flex-wrap">
          <span className={`text-[10px] font-black ${color}`}>{name}</span>
          <span
            className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${special ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-gray-100 text-gray-600'}`}
          >
            {mult}
          </span>
        </div>
        <p className="text-[9px] text-gray-500 mt-0.5">{desc}</p>
      </div>
    </div>
  )
}

function AccordionSection({
  title,
  color,
  dotColor,
  children,
  isOpen,
  onClick,
  badge,
  badgeColor
}: AccordionSectionProps) {
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between px-3.5 py-3 bg-gray-50/70 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
          <span
            className={`text-[11px] font-black uppercase tracking-widest ${color}`}
          >
            {title}
          </span>
          {badge && (
            <span
              className={`text-[7px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${badgeColor ?? 'bg-gray-100 text-gray-500'}`}
            >
              {badge}
            </span>
          )}
        </div>
        <ChevronIcon isOpen={isOpen} />
      </button>

      {isOpen && (
        <div className="p-3.5 bg-white border-t border-gray-100 animate-in fade-in duration-150">
          {children}
        </div>
      )}
    </div>
  )
}

// --- ICONS ---

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      className={`w-3 h-3 text-gray-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={3}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  )
}

function ExternalLinkIcon() {
  return (
    <svg
      className="w-2.5 h-2.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={3}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  )
}
export function BonusExplainerTrigger({ onClick }: { onClick: () => void }) {
  return (
    <div
      className="cursor-pointer select-none flex items-center gap-1.5"
      onClick={onClick}
    >
      <span className="text-red-500 text-[10px] sm:text-xs font-bold">
        LOSE: -50%
      </span>
      <span className="bg-gray-100 hover:bg-gray-200 text-purple-600 text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-md transition-colors tracking-tighter font-bold uppercase">
        Bonuses
      </span>
    </div>
  )
}