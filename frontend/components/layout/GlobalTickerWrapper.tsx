'use client'

import { useEffect, useRef } from 'react'
import OracleMessageTicker from '@/components/tickers/OracleMessageTicker'
import { useUIStore } from '@/app/stores/uiStore'
import { useGameStore } from '@/app/stores/gameStore'
import EventEffectTicker from '@/components/tickers/EventEffectTicker'
import {
  GLOBAL_EVENT_REGISTRY,
  GLOBAL_EVENT_MODE_MAP
} from '@/lib/globalEvents'
import { GlobalEventType } from '@/types/rps'

export default function GlobalTickerWrapper() {
  const oracleTickerMessage = useUIStore((s) => s.oracleTickerMessage)
  const setOracleTickerMessage = useUIStore((s) => s.setOracleTickerMessage)

  const activeGlobalEvent = useGameStore((s) => s.activeGlobalEvent)
  const globalEventPhase = useGameStore((s) => s.globalEventPhase)

  const lastWarningTypeRef = useRef<GlobalEventType | null>(null)

  useEffect(() => {
    if (
      activeGlobalEvent &&
      globalEventPhase === 'warning' &&
      lastWarningTypeRef.current !== activeGlobalEvent
    ) {
      lastWarningTypeRef.current = activeGlobalEvent as GlobalEventType
      const modeKey =
        GLOBAL_EVENT_MODE_MAP[activeGlobalEvent as GlobalEventType]
      const config = modeKey ? GLOBAL_EVENT_REGISTRY[modeKey] : null

      if (!oracleTickerMessage && config) {
        setOracleTickerMessage({
          id: `global-warning-${activeGlobalEvent}-${Date.now()}`,
          content: (
            <span>
              Oracle signal locked.{' '}
              <span
                className="font-black uppercase"
                style={{ color: config.color }}
              >
                {config.label}
              </span>{' '}
              event approaching activation window.
            </span>
          ),
          accentColor: config.color,
          durationMs: 10_000
        })
      }
    }

    if (!activeGlobalEvent) {
      lastWarningTypeRef.current = null
    }
  }, [
    activeGlobalEvent,
    globalEventPhase,
    oracleTickerMessage,
    setOracleTickerMessage
  ])

  return (
    <>
      <EventEffectTicker />
      {oracleTickerMessage && (
        <OracleMessageTicker
          message={oracleTickerMessage}
          onDismiss={() => setOracleTickerMessage(null)}
        />
      )}
    </>
  )
}
