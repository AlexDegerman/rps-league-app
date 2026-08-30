import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === 'production',
  integrations: [Sentry.replayIntegration()],
  tracesSampleRate: 0.01,

  // Quota guard: filter high-frequency routes
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
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
  debug: false,
  enableLogs: false,
  sendDefaultPii: false
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
