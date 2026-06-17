'use client'

import Link from 'next/link'
import { Shield, Zap, Users, Globe, ChevronRight } from 'lucide-react'

interface ShowcaseOption {
  title: string
  subtitle: string
  desc: string
  href: string
  icon: React.ComponentType<{ className?: string; size?: number }>
  color: string
  bg: string
}

const OPTIONS: ShowcaseOption[] = [
  {
    title: 'Relics Catalogue',
    subtitle: 'ANTI-SWAP SOCKET MODIFIERS',
    desc: 'Equippable gameplay enhancers discovered through post-match drops. Modify bonus thresholds, streak rules, or relic acquisition scaling.',
    href: '/showcases/relics',
    icon: Shield,
    color: 'text-indigo-600',
    bg: 'bg-white hover:bg-gray-50 border-gray-200/60'
  },
  {
    title: 'Player Festivals',
    subtitle: 'COOPERATIVE WORLD MILESTONES',
    desc: 'High-impact global events triggered by specific player milestones, including Chrono-Laps, high win streaks, or severe loss streaks.',
    href: '/showcases/festivals',
    icon: Users,
    color: 'text-purple-600',
    bg: 'bg-white hover:bg-gray-50 border-gray-200/60'
  },
  {
    title: 'Flash Events',
    subtitle: 'VOLATILE BETTING OVERRIDES',
    desc: 'Guaranteed-win blitz windows occurring with a 5% chance per prediction. Features full UI overrides, custom soundscapes, and scaling multipliers.',
    href: '/showcases/flashevents',
    icon: Zap,
    color: 'text-amber-600',
    bg: 'bg-white hover:bg-gray-50 border-gray-200/60'
  },
  {
    title: 'Global Events',
    subtitle: 'SYNCHRONIZED ELEMENTAL SURGES',
    desc: 'Orchestrated server-wide events managed directly by the backend via real-time SSE synchronization. Introduces warning phases and dynamic CSS shaders.',
    href: '/showcases/globalevents',
    icon: Globe,
    color: 'text-teal-600',
    bg: 'bg-white hover:bg-gray-50 border-gray-200/60'
  }
]

export default function ShowcasesHub() {
  return (
    <div className="max-w-2xl mx-auto px-4 pb-24">
      <div className="pt-4 pb-6 text-center">
        <div className="text-[11px] tracking-[0.15em] uppercase text-gray-400 mb-2 font-[DM_Mono] font-bold">
          RPS League · Game Systems
        </div>
        <h1 className="text-[28px] font-black text-gray-900 leading-tight mb-1.5 tracking-tight">
          System Showcases
        </h1>
        <p className="text-[13px] text-gray-500 font-[DM_Mono] max-w-sm mx-auto">
          Blueprints, rules, and mathematical breakdowns for the league&apos;s
          primary mechanics.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon
          return (
            <Link
              key={opt.href}
              href={opt.href}
              className={`flex flex-col sm:flex-row gap-4 p-4 rounded-xl border transition-all shadow-sm ${opt.bg}`}
            >
              <div className="flex items-center justify-center p-3 rounded-lg bg-gray-900 text-white shrink-0 self-start sm:self-center shadow">
                <Icon className={opt.color} size={18} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-black tracking-[0.15em] uppercase mb-1 font-[DM_Mono] text-gray-400">
                  {opt.subtitle}
                </div>
                <div className="text-sm font-black text-gray-900 leading-tight mb-1">
                  {opt.title}
                </div>
                <p className="text-[11px] text-gray-500 font-[DM_Mono] leading-relaxed">
                  {opt.desc}
                </p>
              </div>

              <div className="hidden sm:flex items-center justify-center text-gray-300 pl-2">
                <ChevronRight size={16} />
              </div>
            </Link>
          )
        })}
      </div>

      <div className="text-center pt-8 pb-4 text-[11px] text-gray-400 font-[DM_Mono] leading-relaxed">
        rpsleaguegame.vercel.app
        <br />
        unified showcases shell · zero precision loss
      </div>
    </div>
  )
}
