import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "rps-league",
  description: "Track and explore Rock Paper Scissors match results and leaderboards.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <div>
          {children}
        </div>
      </body>
    </html>
  )
}
