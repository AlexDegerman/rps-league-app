'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { getOrCreateUser, isUserValid } from '@/lib/user'
import { fetchUserPoints } from '@/lib/api'
import { useEventTheme } from '@/lib/EventThemeContext'
import { getEventColor } from '@/lib/format'
import { EVENT_HEADER_CONFIG } from '@/lib/eventConfig'

const Header = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [profileHref, setProfileHref] = useState('/profile')
  const pathname = usePathname()
  const { visualMode, brandTheme } = useEventTheme()

  const brandCfg = brandTheme ? EVENT_HEADER_CONFIG[brandTheme] : null
  const modeKey = visualMode?.replace('flash_', '') ?? null

  const navGlow = modeKey ? `nav-glow-${modeKey}` : ''
  const borderCfg = visualMode
    ? EVENT_HEADER_CONFIG[
        visualMode
          .replace('flash_', '')
          .toUpperCase() as keyof typeof EVENT_HEADER_CONFIG
      ]
    : null

  useEffect(() => {
    const user = getOrCreateUser()
    if (!isUserValid(user)) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfileHref(`/profile/${user.shortId}`)
    fetchUserPoints(user.userId, user.shortId, user.nickname).catch(() => {})
  }, [])

  const allNavItems = [
    { label: 'Live', href: '/' },
    { label: 'Ranks', href: '/leaderboard' },
    { label: 'Profile', href: profileHref },
    { label: 'Search', href: '/search' },
    { label: 'Analysis', href: '/analysis' },
    { label: 'Tiers', href: '/showcase' }
  ]

  const navClass = (href: string) =>
    `px-3 py-2 rounded font-bold transition text-xs uppercase tracking-tight whitespace-nowrap ${
      pathname === href
        ? 'bg-yellow-400 text-gray-900 shadow-sm'
        : 'bg-indigo-600 text-white hover:bg-indigo-700'
    }`

  const menuRowItemClass = (href: string) =>
    `px-3 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider transition border ${
      pathname === href
        ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
        : 'bg-white text-gray-600 border-gray-100 hover:bg-gray-50'
    }`

  return (
    <header
      className={`w-full shadow sticky top-0 z-50 overflow-hidden
  ${borderCfg?.borderClass ?? 'border-b border-gray-200'}
`}
    >
      <div className="absolute inset-0 bg-white -z-20" />

      {modeKey && (
        <div
          className={`absolute inset-0 -z-10 event-bg-${modeKey} event-side-${modeKey} `}
        />
      )}

      {modeKey && (
        <>
          <div
            className="event-particle event-particle-down-1 absolute top-1 left-[15%]"
            style={{
              background: getEventColor(modeKey, 0.8),
              boxShadow: `0 0 6px ${getEventColor(modeKey, 0.6)}`
            }}
          />
          <div
            className="event-particle event-particle-down-2 absolute top-1 left-[75%]"
            style={{
              background: getEventColor(modeKey, 0.6),
              boxShadow: `0 0 4px ${getEventColor(modeKey, 0.4)}`
            }}
          />
        </>
      )}

      <div className={`max-w-2xl mx-auto px-4 py-3 relative z-10 ${navGlow}`}>
        <div className="flex items-center gap-3">
          <Link href="/" className="shrink-0" onClick={() => setIsOpen(false)}>
            <Image
              src="/rpslogo.png"
              alt="RPS League"
              width={40}
              height={40}
              style={{ height: 'auto' }}
              className="hover:scale-105 transition-transform"
              priority
            />
          </Link>
          <span
            className={`hidden min-[375px]:inline-block text-sm font-black uppercase tracking-widest select-none ${brandCfg?.textClass ?? 'text-gray-300'}`}
          >
            RPS League
          </span>
          {/* Desktop nav */}
          <nav className="hidden min-[641px]:flex gap-2 ml-auto">
            {allNavItems.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={`nav-btn ${navClass(href)}`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Mobile main bar */}
          <div className="flex min-[640px]:hidden items-center gap-1.5 flex-1 ml-auto">
            <Link href="/" className={`nav-btn ${navClass('/')}`}>
              Live
            </Link>
            <Link
              href="/leaderboard"
              className={`nav-btn ${navClass('/leaderboard')}`}
            >
              Ranks
            </Link>
            <Link
              href={profileHref}
              className={`${navClass(profileHref)} nav-btn hidden min-[320px]:block`}
            >
              Profile
            </Link>
            <Link
              href="/search"
              className={`${navClass('/search')} nav-btn hidden min-[504px]:block`}
            >
              Search
            </Link>
            <Link
              href="/analysis"
              onClick={() => setIsOpen(false)}
              className={`${navClass('/analysis')} nav-btn hidden min-[590px]:block`}
            >
              Analysis
            </Link>
            <Link
              href="/showcase"
              onClick={() => setIsOpen(false)}
              className={`${navClass('/showcase')} nav-btn hidden min-[640px]:block`}
            >
              Tiers
            </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="ml-auto p-2 bg-gray-50 rounded-lg text-gray-600 border border-gray-200 active:bg-gray-200 transition-colors"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {isOpen && (
          <nav className="min-[540px]:hidden mt-3 pt-3 flex flex-row flex-wrap items-center justify-end gap-2 border-t border-gray-100 animate-in fade-in slide-in-from-top-1">
            <Link
              href={profileHref}
              onClick={() => setIsOpen(false)}
              className={`${menuRowItemClass(profileHref)} nav-btn min-[320px]:hidden`}
            >
              Profile
            </Link>
            <Link
              href="/search"
              onClick={() => setIsOpen(false)}
              className={`${menuRowItemClass('/search')} nav-btn min-[400px]:hidden`}
            >
              Search
            </Link>
            <Link
              href="/analysis"
              onClick={() => setIsOpen(false)}
              className={`${menuRowItemClass('/analysis')} nav-btn`}
            >
              Analysis
            </Link>
            <Link
              href="/showcase"
              onClick={() => setIsOpen(false)}
              className={`${menuRowItemClass('/showcase')} nav-btn`}
            >
              Tiers
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}

export default Header
