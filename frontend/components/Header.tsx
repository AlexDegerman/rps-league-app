'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const navItems = [
  { label: 'Newest', href: '/' },
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'Search', href: '/search' },
  { label: 'Profile', href: '/profile' }
]

const Header = () => {
  const pathname = usePathname()
  return (
    <header className="w-full bg-white shadow sticky top-0 z-50">
      <div className="max-w-2xl mx-auto px-2 py-3 flex items-center justify-center gap-3">
        <Link href="/" className="shrink-0">
          <Image src="/rpslogo.png" alt="RPS League" width={52} height={52} />
        </Link>
        <div className="flex gap-2">
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
      </div>
    </header>
  )
}

export default Header
