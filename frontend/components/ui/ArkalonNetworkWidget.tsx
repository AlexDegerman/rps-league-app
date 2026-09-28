'use client'

import { useState, useEffect } from 'react'
import {
  ChevronDown,
  ExternalLink,
  Gamepad2,
  Bot,
  MessageSquare
} from 'lucide-react'

/// Official Arkalon Network Vector Emblem
function ArkalonEmblem({
  size = 24,
  theme = 'dark'
}: {
  size?: number
  theme?: 'dark' | 'light'
}) {
  const fillColor = theme === 'dark' ? '#1E1F22' : '#4F46E5'
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className="shrink-0"
      role="img"
      aria-label="Arkalon"
    >
      <g id="arkalon_mark">
        <g id="outer_silhouette">
          <path
            id="rim"
            d="M440.1 177.85A200 200 0 0 1 445.1 190.89L458.96 188.17A214 214 0 0 1 463.35 203.07L450.23 208.29A200 200 0 0 1 453.54 224.71L467.66 224.44A214 214 0 0 1 469.39 239.88L455.56 242.75A200 200 0 0 1 455.97 259.49L469.92 261.68A214 214 0 0 1 468.95 277.18L454.83 277.6A200 200 0 0 1 452.33 294.16L465.69 298.74A214 214 0 0 1 462.04 313.84L448.06 311.8A200 200 0 1 1 340.52 74.74L333.76 89.24L341.33 102.07L333.57 116.06A160 160 0 1 0 406.82 202.59L422.85 196.92L424.45 184.5Z"
            fill={fillColor}
          />
        </g>
        <g id="probability_core">
          <circle id="core" cx="266.24" cy="246.45" r="112" fill={fillColor} />
        </g>
      </g>
    </svg>
  )
}

export interface NetworkAlert {
  id: string
  type: 'new' | 'updated' | null
}

// Set type to 'new' (green) or 'updated' (golden/amber). Set to null when there are no active alerts.
// Bump 'id' whenever a game launches or receives a major update to show the badge to all players.
export const LATEST_NETWORK_ALERT = {
  id: 'arkalon-daily-v1',
  type: 'new' as 'new' | 'updated' | null
}

const SEEN_ALERT_STORAGE_KEY = 'arkalon_network_seen_alert'
const DISCOVERY_STORAGE_KEY = 'arkalon_network_widget_discovered'

const NETWORK_LINKS = [
  {
    label: 'Other Arkalon Games',
    href: 'https://network.rpsleague.fi',
    icon: Gamepad2
  },
  {
    label: 'AI Guidance',
    href: 'https://network.rpsleague.fi/ai',
    icon: Bot
  },
  {
    label: 'Send Feedback',
    href: 'https://network.rpsleague.fi/feedback',
    icon: MessageSquare
  }
] as const

interface ArkalonNetworkWidgetProps {
  storageKey?: string
  theme?: 'dark' | 'light'
}

export function ArkalonNetworkWidget({
  storageKey = 'arkalon_network_widget_collapsed',
  theme = 'light'
}: ArkalonNetworkWidgetProps) {
  const [collapsed, setCollapsed] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [activeAlert, setActiveAlert] = useState<'new' | 'updated' | null>(null)
  const [isFirstTimeDiscovery, setIsFirstTimeDiscovery] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setMounted(true)

      try {
        const saved = localStorage.getItem(storageKey)
        if (saved === 'false') setCollapsed(false)

        const discovered = localStorage.getItem(DISCOVERY_STORAGE_KEY) === '1'
        if (!discovered) {
          setIsFirstTimeDiscovery(true)
        }

        if (LATEST_NETWORK_ALERT.type) {
          const seenAlert = localStorage.getItem(SEEN_ALERT_STORAGE_KEY)
          if (seenAlert !== LATEST_NETWORK_ALERT.id) {
            setActiveAlert(LATEST_NETWORK_ALERT.type)
          }
        }
      } catch {}
    })

    return () => cancelAnimationFrame(id)
  }, [storageKey])

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(storageKey, String(next))
        if (prev) {
          localStorage.setItem(DISCOVERY_STORAGE_KEY, '1')
          setIsFirstTimeDiscovery(false)
        }
      } catch {}
      return next
    })
  }

  const handleOtherGamesClick = () => {
    setActiveAlert(null)
    try {
      localStorage.setItem(SEEN_ALERT_STORAGE_KEY, LATEST_NETWORK_ALERT.id)
    } catch {}
  }

  if (!mounted) return null

  const isUpdated = activeAlert === 'updated'
  const pipColor = isUpdated ? 'bg-[#F59E0B]' : 'bg-green-500'
  const showNotificationPip = Boolean(activeAlert) || isFirstTimeDiscovery

  // Collapsed State: Logo Only (Floating in corner with discovery or alert pip)
  if (collapsed) {
    return (
      <div className="fixed bottom-10 right-3 sm:bottom-10 sm:right-4 z-40">
        <button
          type="button"
          onClick={toggleCollapse}
          title="Open Arkalon Network Menu"
          aria-label="Open Arkalon Network Menu"
          className="relative flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 bg-white/95 text-indigo-600 hover:text-indigo-700 hover:border-indigo-300 transition-all shadow-lg active:scale-95 cursor-pointer backdrop-blur-md"
        >
          <ArkalonEmblem size={20} theme={theme} />
          {showNotificationPip && (
            <span
              className={`absolute top-0 right-0 w-2.5 h-2.5 rounded-full ${pipColor} border-2 border-white animate-pulse`}
            />
          )}
        </button>
      </div>
    )
  }

  // Expanded State: Floating Corner Dock
  return (
    <>
      <div className="fixed bottom-10 right-3 sm:bottom-10 sm:right-4 z-40 w-[calc(100vw-24px)] max-w-64 rounded-xl border border-gray-200 bg-white p-3 flex flex-col gap-2 shadow-lg animate-[fade-in_0.15s_ease-out_both]">
        {/* Widget Header with Arkalon Logo and Collapse Button */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <div className="flex items-center gap-2">
            <ArkalonEmblem size={22} theme={theme} />
            <div className="flex flex-col">
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-gray-900 leading-none">
                ARKALON NETWORK
              </span>
              <span className="text-[8px] text-gray-500 font-mono leading-tight">
                ECOSYSTEM PORTAL
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleCollapse}
            title="Collapse to logo only"
            aria-label="Collapse to logo only"
            className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <ChevronDown size={14} />
          </button>
        </div>

        {/* 3 Rows of Links under the logo pointing to network.rpsleague.fi */}
        <div className="flex flex-col divide-y divide-gray-100">
          {NETWORK_LINKS.map(({ label, href, icon: Icon }) => {
            const isOtherGames = label === 'Other Arkalon Games'
            return (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={isOtherGames ? handleOtherGamesClick : undefined}
                className="flex items-center justify-between py-1.5 px-1.5 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon
                    size={12}
                    className="text-gray-400 group-hover:text-indigo-600 transition-colors shrink-0"
                  />
                  <span className="text-[11px] font-medium tracking-wide truncate">
                    {label}
                  </span>
                  {isOtherGames && activeAlert && (
                    <span
                      className={`shrink-0 text-[8px] font-mono font-black uppercase px-1.5 py-0.2 rounded border leading-tight ${
                        isUpdated
                          ? 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40'
                          : 'bg-green-500/20 text-green-600 border-green-500/30'
                      }`}
                    >
                      {isUpdated ? 'UPDATED' : 'NEW'}
                    </span>
                  )}
                </div>
                <ExternalLink
                  size={11}
                  className="text-gray-400 opacity-70 group-hover:opacity-100 transition-opacity shrink-0 ml-1"
                />
              </a>
            )
          })}
        </div>
      </div>
    </>
  )
}
