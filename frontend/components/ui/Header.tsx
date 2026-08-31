'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Menu,
  X,
  Sparkles,
  Trophy,
  MessageSquare,
  Megaphone,
  Search
} from 'lucide-react'
import { useUserStore } from '@/app/stores/userStore'
import { useGameStore } from '@/app/stores/gameStore'
import { useUIStore } from '@/app/stores/uiStore'
import { primeOracleVoices } from '@/lib/oracleTTS'
import { EVENT_HEADER_CONFIG } from '@/constants/events'

const Header = () => {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const initUser = useUserStore((s) => s.initUser)
  const shortId = useUserStore((s) => s.shortId)
  const brandTheme = useUIStore((s) => s.brandTheme)
  const randomizeBrandTheme = useUIStore((s) => s.randomizeBrandTheme)

  const visualMode = useGameStore((s) => s.visualMode)
  const festivalModeKey = useGameStore((s) => s.festivalModeKey)

  useEffect(() => {
    randomizeBrandTheme()
    initUser()
    primeOracleVoices()
  }, [randomizeBrandTheme, initUser])

  const brandCfg = EVENT_HEADER_CONFIG[brandTheme]
  const modeKey = visualMode || festivalModeKey || null
  const navGlow = modeKey ? `nav-glow-${modeKey}` : ''
  const profileHref = shortId ? `/profile/${shortId}` : '/profile'

  const borderCfg = modeKey
    ? (EVENT_HEADER_CONFIG[modeKey as keyof typeof EVENT_HEADER_CONFIG] ?? null)
    : null

  const navClass = (href: string) =>
    `px-3 py-2 rounded font-bold transition text-xs uppercase tracking-tight whitespace-nowrap shrink-0 ${
      pathname === href
        ? 'bg-yellow-400 text-gray-900 shadow-sm'
        : 'bg-indigo-600 text-white hover:bg-indigo-700'
    }`

  const menuRowItemClass = (href: string) =>
    `px-4 py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all duration-200 border text-center justify-center flex items-center min-w-[calc(50%-6px)] sm:min-w-[140px] flex-1 active:scale-[0.97] hover:scale-[1.01] ${
      pathname === href
        ? 'bg-yellow-100/70 text-yellow-800 border-yellow-200/80 shadow-sm'
        : 'bg-indigo-50/50 text-indigo-600 border-indigo-100/50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700'
    }`

  const burgerColorClass = modeKey
    ? `text-${
        modeKey.includes('hellfire') ||
        modeKey.includes('sanguine') ||
        modeKey.includes('inferno')
          ? 'red-600'
          : modeKey.includes('lunar') || modeKey.includes('ghost')
            ? 'blue-600'
            : modeKey.includes('electric') ||
                modeKey.includes('spark') ||
                modeKey.includes('surge')
              ? 'purple-600'
              : modeKey.includes('vault')
                ? 'indigo-600'
                : modeKey.includes('safeguard')
                  ? 'slate-600'
                  : 'yellow-600'
      }`
    : 'text-gray-600'

  return (
    <header
      className={`w-full shadow sticky top-0 z-50 transition-colors duration-500 ${borderCfg?.borderClass ?? 'border-b border-gray-200'}`}
    >
      <div className="absolute inset-0 bg-white -z-20" />

      {modeKey && (
        <>
          <div
            className={`absolute inset-0 -z-10 event-bg-${modeKey} event-side-${modeKey}`}
          />
          <div className={`event-dynamic-particles particles-${modeKey}`} />
        </>
      )}

      <div className={`max-w-110 mx-auto px-4 py-3 relative z-10 ${navGlow}`}>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/" className="shrink-0" onClick={() => setIsOpen(false)}>
            <Image
              src="/rpslogo.png"
              alt="RPS League"
              width={36}
              height={36}
              style={{ height: 'auto' }}
              className="hover:scale-105 transition-transform"
              priority
            />
          </Link>

          <span
            className={`hidden! min-[380px]:inline-block! relative text-sm font-black uppercase tracking-widest select-none leading-[1.1] min-[380px]:w-17.5 min-[420px]:w-auto min-[420px]:whitespace-nowrap ${brandCfg?.textClass ?? 'text-gray-300'}`}
          >
            RPS League
          </span>

          <div className="flex items-center gap-1.5 flex-1 ml-auto justify-end">
            <Link href="/" className={navClass('/')}>
              Live
            </Link>
            <Link href="/leaderboard" className={navClass('/leaderboard')}>
              Ranks
            </Link>
            <Link href={profileHref} className={navClass(profileHref)}>
              Profile
            </Link>
            <Link
              href="/arkalon"
              className={`${navClass('/arkalon')} hidden min-[630px]:inline-block`}
            >
              Ask AI
            </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`flex items-center justify-center p-2 rounded-lg border transition-all shrink-0 ${isOpen ? 'bg-gray-800 text-white border-gray-800 shadow-inner' : modeKey ? 'bg-white/50 border-current backdrop-blur-sm ' + burgerColorClass : 'bg-gray-50 border-gray-200 active:bg-gray-200'} min-[480px]:px-3 min-[480px]:gap-2`}
            >
              <span className="hidden min-[480px]:block text-[10px] font-black uppercase tracking-widest">
                More
              </span>
              {isOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {isOpen && (
          <nav
            className={`mt-3 pt-3 pb-2 px-2 flex flex-row flex-wrap items-center justify-center gap-2 min-[540px]:grid min-[540px]:grid-cols-2 border-t border-gray-100 animate-in fade-in slide-in-from-top-1 relative overflow-hidden rounded-b-xl ${modeKey ? `event-bg-${modeKey}` : ''}`}
          >
            <div className="absolute inset-0 bg-white -z-20" />
            <Link
              href="/arkalon"
              onClick={() => setIsOpen(false)}
              className={`${menuRowItemClass('/arkalon')} min-[540px]:hidden`}
            >
              <Sparkles size={13} className="mr-1.5 shrink-0" />
              Ask AI
            </Link>
            <Link
              href="/tiers"
              onClick={() => setIsOpen(false)}
              className={menuRowItemClass('/tiers')}
            >
              <Trophy size={13} className="mr-1.5 shrink-0" />
              Tiers
            </Link>
            <Link
              href="/feedback"
              onClick={() => setIsOpen(false)}
              className={menuRowItemClass('/feedback')}
            >
              <MessageSquare size={13} className="mr-1.5 shrink-0" />
              Feedback
            </Link>
            <Link
              href="/updates"
              onClick={() => setIsOpen(false)}
              className={menuRowItemClass('/updates')}
            >
              <Megaphone size={13} className="mr-1.5 shrink-0" />
              Updates
            </Link>
            <Link
              href="/search"
              onClick={() => setIsOpen(false)}
              className="px-4 py-1 min-[540px]:py-2.5 rounded-lg font-semibold text-[10px] uppercase tracking-wider transition-all duration-200 border text-center justify-center flex items-center min-w-full min-[540px]:min-w-0 mt-0.5 min-[540px]:mt-0 active:scale-[0.97] bg-gray-50/30 text-gray-400 border-gray-100 hover:bg-gray-50 hover:text-gray-500 hover:border-gray-200 opacity-60 hover:opacity-100"
            >
              <Search size={13} className="mr-1.5 shrink-0" />
              Search
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}

export default Header
