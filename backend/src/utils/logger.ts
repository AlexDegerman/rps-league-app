import * as Sentry from '@sentry/node'

const isProd = process.env.NODE_ENV === 'production'
type Extra = Record<string, unknown>

export const logger = {
  error: (message: string, error?: unknown, extra?: Extra) => {
    console.error(
      `[ERROR] ${message}`,
      ...(error !== undefined ? [error] : []),
      ...(extra !== undefined ? [extra] : [])
    )

    if (isProd) {
      if (error instanceof Error) {
        Sentry.captureException(error, {
          ...(extra && { extra }),
          tags: { message }
        })
      } else {
        Sentry.captureMessage(message, {
          ...(extra && { extra: { ...extra, rawError: error } }),
          level: 'error'
        })
      }
    }
  },

  warn: (message: string, extra?: Extra) => {
    console.warn(`[WARN] ${message}`, ...(extra !== undefined ? [extra] : []))

    if (isProd) {
      Sentry.captureMessage(message, {
        ...(extra && { extra }),
        level: 'warning'
      })
    }
  },

  info: (message: string, extra?: Extra) => {
    console.log(`[INFO] ${message}`, ...(extra !== undefined ? [extra] : []))
    
    if (isProd) {
      Sentry.addBreadcrumb({
        message,
        ...(extra && { data: extra }),
        level: 'info'
      })
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
