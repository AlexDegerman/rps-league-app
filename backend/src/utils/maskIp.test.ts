import { describe, it, expect } from 'vitest'
import { anonymizeIp, maskIpForLogs } from './maskIp.js'

describe('IP Mask Service', () => {
  describe('anonymizeIp - Subnet Masking for Database Compatibility', () => {
    describe('Boundary & Empty States', () => {
      it('should return an empty string if the IP is undefined, empty, or already set to anonymous', () => {
        expect(anonymizeIp(undefined)).toBe('')
        expect(anonymizeIp('')).toBe('')
        expect(anonymizeIp('anonymous')).toBe('')
      })

      it('should fallback to returning the original cleaned string if the IP format is invalid or incomplete', () => {
        // Input has too few IPv4/IPv6 segments, so no masking rules apply and the original value is returned unchanged
        expect(anonymizeIp('192.168')).toBe('192.168')
        expect(anonymizeIp('2001:db8')).toBe('2001:db8')
      })
    })

    describe('IPv4 Anonymization (Class C /24 Masking)', () => {
      it('should correctly nullify the last octet of a standard IPv4 address', () => {
        const rawIp = '192.168.1.15'
        const expected = '192.168.1.0'

        const result = anonymizeIp(rawIp)

        expect(result).toBe(expected)
      })

      it('should properly process local and broadcast boundary values', () => {
        expect(anonymizeIp('127.0.0.1')).toBe('127.0.0.0')
        expect(anonymizeIp('255.255.255.255')).toBe('255.255.255.0')
      })
    })

    describe('IPv6 Anonymization (Routing Prefix Masking)', () => {
      it('should truncate and retain only the first three groups to keep block lookup validity', () => {
        const rawIp = '2001:0db8:85a3:0000:0000:8a2e:0370:7334'
        const expected = '2001:0db8:85a3::'

        const result = anonymizeIp(rawIp)

        expect(result).toBe(expected)
      })

      it('should correctly mask shorthand IPv6 addresses with fewer declared blocks', () => {
        const rawIp = '2001:db8::ff00:42:8329'
        const expected = '2001:db8:::'

        const result = anonymizeIp(rawIp)

        expect(result).toBe(expected)
      })
    })

    describe('Multi-Hop Proxy Headers (X-Forwarded-For split verification)', () => {
      it('should isolate and mask only the first (client) IP in a comma-separated proxy chain', () => {
        const chain = '192.168.5.112, 10.0.0.1, 172.16.0.1'
        const expected = '192.168.5.0'

        const result = anonymizeIp(chain)

        expect(result).toBe(expected)
      })
    })
  })

  describe('maskIpForLogs - Trail Masking for Human-Readable Audit Logs', () => {
    describe('Fallback & Default States', () => {
      it('should return the string "anonymous" if input is undefined, anonymous, or unknown', () => {
        expect(maskIpForLogs(undefined)).toBe('anonymous')
        expect(maskIpForLogs('anonymous')).toBe('anonymous')
        expect(maskIpForLogs('unknown')).toBe('anonymous')
      })

      it('should fallback to returning the original cleaned string if the block count is insufficient', () => {
        expect(maskIpForLogs('192')).toBe('192')
        expect(maskIpForLogs('2001')).toBe('2001')
      })
    })

    describe('IPv4 Log Masking (Trailing Wildcards)', () => {
      it('should mask the last two octets with placeholders for privacy', () => {
        const rawIp = '192.168.1.15'
        const expected = '192.168.x.x'

        const result = maskIpForLogs(rawIp)

        expect(result).toBe(expected)
      })

      it('should safely process and mask class C boundary values', () => {
        expect(maskIpForLogs('10.0.0.1')).toBe('10.0.x.x')
        expect(maskIpForLogs('255.255.255.255')).toBe('255.255.x.x')
      })
    })

    describe('IPv6 Log Masking (Trailing Wildcards)', () => {
      it('should mask the third block with xxxx and nullify remaining segments', () => {
        const rawIp = '2001:0db8:85a3:0000:0000:8a2e:0370:7334'
        const expected = '2001:0db8:xxxx::'

        const result = maskIpForLogs(rawIp)

        expect(result).toBe(expected)
      })
    })

    describe('Multi-Hop Proxy Headers for Logs', () => {
      it('should isolate and mask only the primary client IP from proxy chains', () => {
        const chain = '192.168.5.112, 10.0.0.1'
        const expected = '192.168.x.x'

        const result = maskIpForLogs(chain)

        expect(result).toBe(expected)
      })
    })
  })
})
