'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { getEventColor } from '@/lib/format'
import { EVENT_HEADER_CONFIG } from '@/lib/eventConfig'
import { useUserStore } from '@/app/stores/userStore'
import { useGameStore } from '@/app/stores/gameStore'
import { useUIStore } from '@/app/stores/uiStore'

const Header = () => {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { initUser, shortId } = useUserStore()
  const { brandTheme, randomizeBrandTheme } = useUIStore()
  const visualMode = useGameStore((s) => s.visualMode)

  useEffect(() => {
    randomizeBrandTheme()
    initUser()
  }, [randomizeBrandTheme, initUser])

  const brandCfg = EVENT_HEADER_CONFIG[brandTheme]
  const modeKey = visualMode?.replace('flash_', '') ?? null
  const navGlow = modeKey ? `nav-glow-${modeKey}` : ''
  const profileHref = shortId ? `/profile/${shortId}` : '/profile'

  const borderCfg = modeKey
    ? EVENT_HEADER_CONFIG[
        modeKey.toUpperCase() as keyof typeof EVENT_HEADER_CONFIG
      ]
    : null

  const navClass = (href: string) =>
    `px-3 py-2 rounded font-bold transition text-xs uppercase tracking-tight whitespace-nowrap shrink-0 ${
      pathname === href
        ? 'bg-yellow-400 text-gray-900 shadow-sm'
        : 'bg-indigo-600 text-white hover:bg-indigo-700'
    }`

  const menuRowItemClass = (href: string) =>
    `px-4 py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition border text-center justify-center flex items-center min-w-[calc(50%-6px)] sm:min-w-[140px] flex-1 ${
      pathname === href
        ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
        : 'bg-white text-gray-600 border-gray-100 hover:bg-gray-50'
    }`

  const burgerColorClass = modeKey
    ? `text-${
        modeKey === 'hellfire'
          ? 'red-600'
          : modeKey === 'lunar'
            ? 'blue-600'
            : modeKey === 'electric'
              ? 'purple-600'
              : 'yellow-600'
      }`
    : 'text-gray-600'

  return (
    <header
      className={`w-full shadow sticky top-0 z-50 transition-colors duration-500 ${borderCfg?.borderClass ?? 'border-b border-gray-200'}`}
    >
      <div className="absolute inset-0 bg-white -z-20" />

      {modeKey && (
        <div
          className={`absolute inset-0 -z-10 event-bg-${modeKey} event-side-${modeKey}`}
        />
      )}

      {modeKey === 'hellfire' ? (
        <div className="event-hellfire-ember" />
      ) : (
        modeKey && (
          <div
            className="event-particle event-particle-down-1 absolute top-1 left-[15%]"
            style={{
              background: getEventColor(modeKey, 0.8),
              boxShadow: `0 0 6px ${getEventColor(modeKey, 0.6)}`
            }}
          />
        )
      )}

      <div className={`max-w-110 mx-auto px-4 py-3 relative z-10 ${navGlow}`}>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* LOGO */}
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

          {/* BRANDING: Hidden <380, Wrapped 380-419, 1-Line 420+ */}
          <span
            data-text="RPS League"
            className={`hidden! min-[380px]:inline-block! relative text-sm font-black uppercase tracking-widest select-none leading-[1.1]
              min-[380px]:w-17.5 min-[420px]:w-auto min-[420px]:whitespace-nowrap
              ${brandCfg?.textClass ?? 'text-gray-300'}
            `}
          >
            RPS League
          </span>

          {/* RIGHT SIDE ACTIONS */}
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

            {/* Smart More Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`flex items-center justify-center p-2 rounded-lg border transition-all shrink-0 ${
                isOpen
                  ? 'bg-gray-800 text-white border-gray-800 shadow-inner'
                  : modeKey
                    ? 'bg-white/50 border-current backdrop-blur-sm ' +
                      burgerColorClass
                    : 'bg-gray-50 border-gray-200 active:bg-gray-200'
              } min-[480px]:px-3 min-[480px]:gap-2`}
            >
              <span className="hidden min-[480px]:block text-[10px] font-black uppercase tracking-widest">
                More
              </span>
              {isOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* DROPDOWN MENU */}
        {isOpen && (
          <nav
            className={`mt-3 pt-3 pb-4 px-2 flex flex-row flex-wrap items-center justify-center gap-2 border-t border-gray-100 animate-in fade-in slide-in-from-top-1 relative overflow-hidden rounded-b-xl ${modeKey ? `event-bg-${modeKey}` : ''}`}
          >
            <div className="absolute inset-0 bg-white -z-20" />

            <Link
              href="/analysis"
              onClick={() => setIsOpen(false)}
              className={menuRowItemClass('/analysis')}
            >
              Analysis
            </Link>
            <Link
              href="/showcase"
              onClick={() => setIsOpen(false)}
              className={menuRowItemClass('/showcase')}
            >
              Tiers
            </Link>
            <Link
              href="/feedback"
              onClick={() => setIsOpen(false)}
              className={menuRowItemClass('/feedback')}
            >
              Feedback
            </Link>
            <Link
              href="/updates"
              onClick={() => setIsOpen(false)}
              className={menuRowItemClass('/updates')}
            >
              Updates
            </Link>
            <Link
              href="/search"
              onClick={() => setIsOpen(false)}
              className={`${menuRowItemClass('/search')} opacity-60`}
            >
              Search
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}

export default Header
