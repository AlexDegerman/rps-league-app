import geoip from 'geoip-lite'
import { anonymizeIp } from './maskIp.js'

export interface GeoLocation {
  town: string | null
  country: string | null
}

/**
 * Resolves an approximate town and country offline.
 * Automatically masks IPs and intercepts localhost loopbacks.
 */
export const getCoarseLocation = (rawIp: string | undefined): GeoLocation => {
  if (!rawIp || rawIp === 'anonymous') {
    return { town: null, country: null }
  }

  const maskedIp = anonymizeIp(rawIp)

  if (
    maskedIp === '::1' ||
    maskedIp === '127.0.0.1' ||
    maskedIp.startsWith('::ffff:127.') ||
    maskedIp.startsWith('192.168.') ||
    maskedIp.startsWith('10.')
  ) {
    return { town: 'Developer Localhost', country: 'DEV' }
  }

  try {
    const geo = geoip.lookup(maskedIp)
    if (geo) {
      return {
        town: geo.city || null,
        country: geo.country || null
      }
    }
  } catch {
    // Fail silently to prevent lookup errors from breaking core system threads
  }

  return { town: null, country: null }
}
