import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring: set to 1% to preserve free tier credits
  tracesSampleRate: 0.01,

  // Quota Guard: Filter high-frequency routes from edge performance tracing
  beforeSendTransaction(event) {
    const name = event.transaction
    const ignoreList = [
      '/api/live',
      '/api/matches/pending',
      '/points',
      '/stats/daily'
    ]

    if (name && ignoreList.some((path) => name.includes(path))) {
      return null
    }

    return event
  },

  // Operational stability settings
  debug: false,
  enableLogs: false,
  sendDefaultPii: false
})
