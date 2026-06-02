import * as Sentry from '@sentry/nextjs'

const isProd = process.env.NODE_ENV === 'production'

type Extra = Record<string, unknown>

export const logger = {
  error: (message: string, error?: unknown, extra?: Extra) => {
    if (isProd) {
      if (error instanceof Error) {
        Sentry.captureException(error, { extra, tags: { message } })
      } else {
        Sentry.captureMessage(message, {
          extra: { ...extra, rawError: error },
          level: 'error'
        })
      }
    }

    if (!isProd) {
      console.error(
        `[ERROR] ${message}`,
        ...(error !== undefined ? [error] : []),
        ...(extra !== undefined ? [extra] : [])
      )
    }
  },

  warn: (message: string, extra?: Extra) => {
    if (isProd) {
      Sentry.captureMessage(message, { extra, level: 'warning' })
    }

    if (!isProd) {
      console.warn(`[WARN] ${message}`, ...(extra !== undefined ? [extra] : []))
    }
  },

  info: (message: string, extra?: Extra) => {
    if (isProd) {
      Sentry.addBreadcrumb({ message, data: extra, level: 'info' })
    }

    if (!isProd) {
      console.log(`[INFO] ${message}`, ...(extra !== undefined ? [extra] : []))
    }
  },

  // For BigInt-heavy contexts - stringify before sending
  errorWithPoints: (
    message: string,
    error?: unknown,
    extra?: Extra & { points?: bigint; balance?: bigint }
  ) => {
    const safeExtra = extra
      ? {
          ...extra,
          ...(extra.points !== undefined && {
            points: extra.points.toString()
          }),
          ...(extra.balance !== undefined && {
            balance: extra.balance.toString()
          })
        }
      : undefined

    logger.error(message, error, safeExtra)
  }
}
