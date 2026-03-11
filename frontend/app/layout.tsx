import type { Metadata } from "next"
import "./globals.css"
import Header from "../components/Header"

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
      <body className="flex flex-col min-h-screen text-gray-900 items-center">
        <div className="w-[95%] max-w-[750px] min-w-[280px] mt-6">
          <Header />
        </div>

        <main className="flex flex-col items-center w-[95%] max-w-[750px] min-w-[280px] bg-white shadow p-6 flex-1">
          {children}
        </main>
      </body>
    </html>
  )
}
