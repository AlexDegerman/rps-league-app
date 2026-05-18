import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  integrations: [Sentry.replayIntegration()],

  // Performance Monitoring: Set to 1% to stay within the 10k monthly limit.
  tracesSampleRate: 0.01,

  // Quota Guard: Drop performance traces for high-frequency heartbeat routes.
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

  // Session Replay: Set session rate to 0 to save your 50 monthly credits.
  // Set Error rate to 1.0 to capture a video reproduction only when a crash occurs.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  // Operational settings
  debug: false,
  enableLogs: false,
  sendDefaultPii: false
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
