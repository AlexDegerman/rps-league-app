const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// Local development: use a mock player because Arkalon Network is not running
const isLocalhost =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'

const DUMMY_CORE_ID = '11111111-1111-4111-8111-111111111111'
const DUMMY_SHORT_ID = 'LocalDev01'
const DUMMY_NICKNAME = 'AncientGoldTurtle'

export async function getOrCreatePlayer() {
  if (isLocalhost) {
    return {
      coreId: DUMMY_CORE_ID,
      shortId: DUMMY_SHORT_ID,
      displayName: DUMMY_NICKNAME
    }
  }

  const res = await fetch(`${API_BASE}/api/identity/provision`, {
    method: 'POST',
    credentials: 'include'
  })

  if (!res.ok) throw new Error('Failed to provision identity')
  return res.json()
}

export async function rerollPlayerName() {
  const res = await fetch(`${API_BASE}/api/identity/reroll`, {
    method: 'POST',
    credentials: 'include'
  })

  if (!res.ok) throw new Error('Failed to reroll name')
  return res.json()
}
