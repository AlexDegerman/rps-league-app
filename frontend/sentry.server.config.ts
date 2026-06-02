import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === 'production',
  // Performance Monitoring: Set to 1% to stay within the 10k monthly limit.
  // Note: This does not affect Error Tracking, which remains at 100%.
  tracesSampleRate: 0.01,

  // Quota Guard: Drop performance traces for high-frequency "heartbeat" routes.
  // This prevents the 5-second match pulse from exhausting your credits.
  beforeSendTransaction(event) {
    const name = event.transaction
    const ignoreList = [
      '/api/live', // SSE stream
      '/api/matches/pending', // Pending match polling
      '/points', // Balance syncing
      '/stats/daily' // Ticker updates
    ]

    if (name && ignoreList.some((path) => name.includes(path))) {
      return null
    }

    return event
  },

  // Operational settings for production stability
  debug: false,
  enableLogs: false,
  sendDefaultPii: false
})
