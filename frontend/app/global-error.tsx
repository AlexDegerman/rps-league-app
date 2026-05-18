'use client'

import * as Sentry from '@sentry/nextjs'
import NextError from 'next/error'
import { useEffect } from 'react'

export default function GlobalError({
  error
}: {
  error: Error & { digest?: string }
}) {
  useEffect(() => {
    // Log the catastrophic failure to Sentry immediately
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body className="bg-gray-100 min-h-screen flex items-center justify-center">
        {/* Render the generic Next.js error UI*/}
        <NextError statusCode={0} />
      </body>
    </html>
  )
}
