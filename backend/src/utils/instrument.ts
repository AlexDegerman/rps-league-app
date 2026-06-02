import * as Sentry from '@sentry/node'
import { nodeProfilingIntegration } from '@sentry/profiling-node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [nodeProfilingIntegration()],
  enabled: process.env.NODE_ENV === 'production',
  // Performance Monitoring: Set to 1% to match frontend and stay within limits.
  tracesSampleRate: 0.01,

  // Profiling: Set to the same rate as transactions.
  profilesSampleRate: 0.01,

  // Quota Guard: Filter out high-frequency heartbeat routes to save credits.
  beforeSendTransaction(event) {
    const name = event.transaction
    const ignoreList = [
      '/api/live', // SSE stream (constant connection)
      '/api/matches/pending', // 5-second polling
      '/points', // Frequent balance syncs
      '/api/stats/daily', // Ticker updates
      '/health' // Internal uptime checks
    ]

    if (name && ignoreList.some((path) => name.includes(path))) {
      return null
    }

    return event
  },

  // Security and privacy for production
  sendDefaultPii: false
})
