'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { getOrCreateUser, isUserValid } from '@/lib/user'
import { fetchUserPoints } from '@/lib/api'

const Header = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [profileHref, setProfileHref] = useState('/profile')
  const pathname = usePathname()

  useEffect(() => {
    const user = getOrCreateUser()

    if (!isUserValid(user)) return

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfileHref(`/profile/${user.shortId}`)
    fetchUserPoints(user.userId, user.shortId, user.nickname).catch(() => {})
  }, [])
  
  const allNavItems = [
    { label: 'Live', href: '/' },
    { label: 'Leaderboard', href: '/leaderboard' },
    { label: 'Profile', href: profileHref },
    { label: 'Search', href: '/search' },
    { label: 'Analysis', href: '/analysis' }
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
    <header className="w-full bg-white shadow sticky top-0 z-50">
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
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

          {/* Desktop/Full Nav */}
          <nav className="hidden min-[460px]:flex gap-2">
            {allNavItems.map(({ label, href }) => (
              <Link key={href} href={href} className={navClass(href)}>
                {label === 'Leaderboard' ? 'Ranks' : label}
              </Link>
            ))}
          </nav>

          {/* Mobile Main Bar */}
          <div className="flex min-[460px]:hidden items-center gap-1.5 flex-1">
            <Link href="/" className={navClass('/')}>
              Live
            </Link>
            <Link href="/leaderboard" className={navClass('/leaderboard')}>
              Ranks
            </Link>

            <Link
              href={profileHref}
              className={`${navClass(profileHref)} hidden min-[320px]:block`}
            >
              Profile
            </Link>

            <Link
              href="/search"
              className={`${navClass('/search')} hidden min-[400px]:block`}
            >
              Search
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
          <nav className="min-[460px]:hidden mt-3 pt-3 flex flex-row flex-wrap items-center justify-end gap-2 border-t border-gray-100 animate-in fade-in slide-in-from-top-1">
            <Link
              href={profileHref}
              onClick={() => setIsOpen(false)}
              className={`${menuRowItemClass(profileHref)} min-[320px]:hidden`}
            >
              Profile
            </Link>

            <Link
              href="/search"
              onClick={() => setIsOpen(false)}
              className={`${menuRowItemClass('/search')} min-[400px]:hidden`}
            >
              Search
            </Link>

            <Link
              href="/analysis"
              onClick={() => setIsOpen(false)}
              className={menuRowItemClass('/analysis')}
            >
              Analysis
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}

export default Header
