import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

class MockEventSource {
  onopen: ((this: EventSource, ev: Event) => void) | null = null
  onmessage: ((this: EventSource, ev: MessageEvent) => void) | null = null
  onerror: ((this: EventSource, ev: Event) => void) | null = null

  close = vi.fn()
  addEventListener = vi.fn()
  removeEventListener = vi.fn()

  readonly url: string = ''
  readonly readyState: number = 0
  readonly withCredentials: boolean = false
}

global.EventSource = MockEventSource as unknown as typeof EventSource

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString()
    }),
    clear: vi.fn(() => {
      store = {}
    })
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

window.scrollTo = vi.fn()

Object.defineProperty(global, 'crypto', {
  value: { randomUUID: () => 'test-uuid' }
})
