const RATE_LIMIT = 5

interface RateLimitState {
  requestTimestamps: number[]
  cooldownUntil: number
  violations: number[]
}

const rateLimitMap = new Map<string, RateLimitState>()

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; error: 'RATE_LIMITED' }

export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now()

  const userState: RateLimitState = rateLimitMap.get(ip) ?? {
    requestTimestamps: [],
    cooldownUntil: 0,
    violations: []
  }

  if (now < userState.cooldownUntil) {
    return { allowed: false, error: 'RATE_LIMITED' }
  }

  userState.requestTimestamps = userState.requestTimestamps.filter(
    (t) => now - t < 60 * 1000
  )

  if (userState.requestTimestamps.length >= RATE_LIMIT) {
    userState.violations = userState.violations.filter(
      (t) => now - t < 10 * 60 * 1000
    )
    userState.violations.push(now)
    const violationCount = userState.violations.length

    const cooldownDuration =
      violationCount === 1
        ? 1 * 60 * 1000
        : violationCount === 2
          ? 5 * 60 * 1000
          : violationCount === 3
            ? 15 * 60 * 1000
            : 60 * 60 * 1000

    userState.cooldownUntil = now + cooldownDuration
    rateLimitMap.set(ip, userState)
    return { allowed: false, error: 'RATE_LIMITED' }
  }

  userState.requestTimestamps.push(now)
  rateLimitMap.set(ip, userState)
  return { allowed: true }
}

export function pruneRateLimiter(): void {
  const now = Date.now()
  for (const [ip, state] of rateLimitMap.entries()) {
    state.requestTimestamps = state.requestTimestamps.filter(
      (t) => now - t < 60 * 1000
    )
    state.violations = state.violations.filter((t) => now - t < 10 * 60 * 1000)
    const isActive =
      now < state.cooldownUntil ||
      state.requestTimestamps.length > 0 ||
      state.violations.length > 0
    if (!isActive) rateLimitMap.delete(ip)
  }
  if (rateLimitMap.size > 1000) rateLimitMap.clear()
}

if (process.env.NODE_ENV !== 'test') {
  setInterval(pruneRateLimiter, 1000 * 60 * 60)
}
