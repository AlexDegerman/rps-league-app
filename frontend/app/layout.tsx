import type { Metadata } from 'next'
import './globals.css'
import Header from '../components/Header'

export const metadata: Metadata = {
  title: 'RPS League',
  description:
    'Track and explore Rock Paper Scissors match results and leaderboards.',
  icons: {
    icon: '/rpslogo.png'
  }
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-100 min-h-screen">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-4 w-full overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  )
}
