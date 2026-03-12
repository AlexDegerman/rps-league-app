'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { label: 'Newest', href: '/' },
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'Search', href: '/search' },
]

const Header = () => {
  const pathname = usePathname()

  return (
    <header className="w-full bg-white shadow">
      <div className="max-w-2xl mx-auto px-2 py-3 flex justify-center gap-2">
        {navItems.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className={`px-3 py-2 rounded font-medium transition text-sm whitespace-nowrap ${
              pathname === href
                ? 'bg-yellow-400 text-gray-900'
                : 'bg-indigo-600 text-white hover:bg-yellow-400 hover:text-gray-900'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
    </header>
  )
}

export default Header