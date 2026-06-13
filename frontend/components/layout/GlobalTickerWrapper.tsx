'use client'

import OracleMessageTicker from '@/components/tickers/OracleMessageTicker'
import { useUIStore } from '@/app/stores/uiStore'
import FestivalEffectTicker from '../tickers/FestivalEventTicker'

export default function GlobalTickerWrapper() {
  const { oracleTickerMessage, setOracleTickerMessage } = useUIStore()

  return (
    <div className="flex flex-col w-full">
      <OracleMessageTicker
        key={oracleTickerMessage?.id ?? 'idle'}
        message={oracleTickerMessage}
        onDismiss={() => setOracleTickerMessage(null)}
      />

      {!oracleTickerMessage && <FestivalEffectTicker />}
    </div>
  )
}
