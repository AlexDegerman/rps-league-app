/**
 * Masks the client IP address to a valid subnet format (.0 or ::)
 * so it can still be parsed by offline lookup databases.
 */
export const anonymizeIp = (ip: string | undefined): string => {
  if (!ip || ip === 'anonymous') return ''

  const cleanIp = ip.split(',')[0]?.trim() ?? ''

  if (cleanIp.includes('.')) {
    const [p0, p1, p2, p3] = cleanIp.split('.')
    if (
      p0 !== undefined &&
      p1 !== undefined &&
      p2 !== undefined &&
      p3 !== undefined
    ) {
      return `${p0}.${p1}.${p2}.0`
    }
  }

  if (cleanIp.includes(':')) {
    const [p0, p1, p2] = cleanIp.split(':')
    if (p0 !== undefined && p1 !== undefined && p2 !== undefined) {
      return `${p0}:${p1}:${p2}::`
    }
  }

  return cleanIp
}

/**
 * Masks an IP address specifically for human-readable audit logs (e.g. Discord).
 * Safely replaces trailing blocks with 'x' for both IPv4 and IPv6.
 */
export const maskIpForLogs = (ip: string | undefined): string => {
  if (!ip || ip === 'unknown' || ip === 'anonymous') return 'anonymous'

  const cleanIp = ip.split(',')[0]?.trim() ?? ''

  if (cleanIp.includes('.')) {
    const [p0, p1] = cleanIp.split('.')
    if (p0 !== undefined && p1 !== undefined) {
      return `${p0}.${p1}.x.x`
    }
  }

  if (cleanIp.includes(':')) {
    const [p0, p1] = cleanIp.split(':')
    if (p0 !== undefined && p1 !== undefined) {
      return `${p0}:${p1}:xxxx::`
    }
  }

  return cleanIp
}
