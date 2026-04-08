'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

const allNavItems = [
  { label: 'Live', href: '/' },
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'Profile', href: '/profile' },
  { label: 'Search', href: '/search' },
  { label: 'Analysis', href: '/analysis' }
]

const Header = () => {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const navClass = (href: string) =>
    `px-3 py-2 rounded font-bold transition text-xs uppercase tracking-tight whitespace-nowrap ${
      pathname === href
        ? 'bg-yellow-400 text-gray-900 shadow-sm'
        : 'bg-indigo-600 text-white hover:bg-indigo-700'
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

          {/* Desktop/Full Nav - Displays all links and removes burger above 460px */}
          <nav className="hidden min-[460px]:flex gap-2">
            {allNavItems.map(({ label, href }) => (
              <Link key={href} href={href} className={navClass(href)}>
                {label === 'Leaderboard' ? 'Ranks' : label}
              </Link>
            ))}
          </nav>

          {/* Dynamic Mobile Nav - Logic for 360px and 420px */}
          <div className="flex min-[460px]:hidden items-center gap-1.5 flex-1">
            <Link href="/" className={navClass('/')}>
              Live
            </Link>
            <Link href="/leaderboard" className={navClass('/leaderboard')}>
              Ranks
            </Link>

            {/* Show Profile starting at 360px */}
            <Link
              href="/profile"
              className={`${navClass('/profile')} hidden min-[320px]:block`}
            >
              Profile
            </Link>

            {/* Show Search starting at 420px */}
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

        {/* Dropdown - Dynamically hides items already shown in the header */}
        {isOpen && (
          <nav className="min-[460px]:hidden mt-3 py-2 flex flex-col gap-2 border-t border-gray-100 animate-in fade-in slide-in-from-top-1">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className={`px-4 py-3 rounded-xl font-bold text-sm transition min-[360px]:hidden ${
                pathname === '/profile'
                  ? 'bg-yellow-50 text-yellow-800 border-l-4 border-yellow-400'
                  : 'bg-white text-gray-600 border border-gray-100'
              }`}
            >
              Profile
            </Link>

            {/* Hide Search in menu if width > 400px */}
            <Link
              href="/search"
              onClick={() => setIsOpen(false)}
              className={`px-4 py-3 rounded-xl font-bold text-sm transition min-[420px]:hidden ${
                pathname === '/search'
                  ? 'bg-yellow-50 text-yellow-800 border-l-4 border-yellow-400'
                  : 'bg-white text-gray-600 border border-gray-100'
              }`}
            >
              Search
            </Link>

            {/* Analysis always in menu until 460px breakpoint clears everything */}
            <Link
              href="/analysis"
              onClick={() => setIsOpen(false)}
              className={`px-4 py-3 rounded-xl font-bold text-sm transition ${
                pathname === '/analysis'
                  ? 'bg-yellow-50 text-yellow-800 border-l-4 border-yellow-400'
                  : 'bg-white text-gray-600 border border-gray-100'
              }`}
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
