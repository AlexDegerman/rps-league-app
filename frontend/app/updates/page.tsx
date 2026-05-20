'use client'

import { useState, useEffect, useRef } from 'react'
import { UPDATES, CURRENT_VERSION, type Update } from '@/lib/updates'

type SortOrder = 'newest' | 'oldest'

export default function UpdatesPage() {
  const [openVersion, setOpenVersion] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')

  // 2. REFINE THE REF TYPE (Added a check for null later)
  const containerRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // 3. EXPLICITLY TYPE THE SORTED ARRAY
  const sorted: Update[] =
    sortOrder === 'newest' ? UPDATES : [...UPDATES].reverse()

  useEffect(() => {
    if (openVersion) {
      setTimeout(() => {
        containerRefs.current[openVersion]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        })
      }, 100)
    }
  }, [openVersion])

  const toggle = (version: string) => {
    setOpenVersion((prev) => (prev === version ? null : version))
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-black text-gray-900 uppercase tracking-widest whitespace-nowrap">
            Update History
          </h1>
          <p className="text-[10px] sm:text-[11px] text-gray-400 font-medium mt-0.5 uppercase tracking-wide">
            {UPDATES.length} updates recorded
          </p>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 shrink-0">
          {(['newest', 'oldest'] as const).map((order) => (
            <button
              key={order}
              type="button"
              onClick={() => setSortOrder(order)}
              className={`text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-md transition-colors ${
                sortOrder === order
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {order}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {sorted.map((update: Update) => {
          const isOpen = openVersion === update.version
          const isNewest = update.version === CURRENT_VERSION

          return (
            <div
              key={update.version}
              ref={(el) => {
                if (el) containerRefs.current[update.version] = el
              }}
              className={`bg-white rounded-xl border shadow-sm transition-all duration-200 overflow-hidden scroll-mt-20 ${
                isNewest
                  ? 'border-green-300 ring-1 ring-green-50'
                  : isOpen
                    ? 'border-indigo-200'
                    : 'border-gray-100'
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(update.version)}
                className="w-full flex items-start gap-3 px-4 py-4 text-left"
              >
                <span
                  className={`shrink-0 w-11 text-center text-[10px] font-black uppercase tracking-widest py-1 rounded-md transition-colors mt-0.5 ${
                    isNewest
                      ? 'bg-green-500 text-white'
                      : isOpen
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  v{update.version}
                </span>

                <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-gray-800 leading-tight">
                    {update.label}
                  </span>

                  {isNewest && (
                    <span className="self-start sm:self-auto shrink-0 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      Latest
                    </span>
                  )}
                </div>

                <svg
                  className={`shrink-0 w-4 h-4 text-gray-400 mt-1 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isOpen && (
                <div className="px-4 pb-5 border-t border-gray-50 pt-4 animate-in fade-in slide-in-from-top-1 duration-200 bg-gray-50/30">
                  <ul className="flex flex-col gap-3">
                    {update.notes.map((note: string, i: number) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        <p className="text-[12px] text-gray-600 font-medium leading-relaxed">
                          {note}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
