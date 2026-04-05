'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

const allNavItems = [
  { label: 'Newest', href: '/' },
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'Profile', href: '/profile' },
  { label: 'Search', href: '/search' },
  { label: 'Analysis', href: '/analysis' }
]

const Header = () => {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

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

          <nav className="hidden min-[550px]:flex gap-2">
            {allNavItems.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={`px-3 py-2 rounded font-bold transition text-xs uppercase tracking-tight ${
                  pathname === href
                    ? 'bg-yellow-400 text-gray-900 shadow-sm'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex min-[550px]:hidden items-center gap-1.5 flex-1">
            <Link
              href="/"
              className={`px-3 py-2 rounded font-bold text-xs uppercase ${
                pathname === '/'
                  ? 'bg-yellow-400 text-gray-900'
                  : 'bg-indigo-600 text-white'
              }`}
            >
              Newest
            </Link>
            <Link
              href="/leaderboard"
              className={`px-3 py-2 rounded font-bold text-xs uppercase ${
                pathname === '/leaderboard'
                  ? 'bg-yellow-400 text-gray-900'
                  : 'bg-indigo-600 text-white'
              }`}
            >
              Ranks
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
          <nav className="min-[600px]:hidden mt-3 py-2 flex flex-col gap-2 border-t border-gray-100 animate-in fade-in slide-in-from-top-1">
            {[allNavItems[2], allNavItems[3], allNavItems[4]].map(
              ({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsOpen(false)}
                  className={`px-4 py-3 rounded-xl font-bold text-sm transition ${
                    pathname === href
                      ? 'bg-yellow-50 text-yellow-800 border-l-4 border-yellow-400'
                      : 'bg-white text-gray-600 border border-gray-100'
                  }`}
                >
                  {label}
                </Link>
              )
            )}
          </nav>
        )}
      </div>
    </header>
  )
}

export default Header
