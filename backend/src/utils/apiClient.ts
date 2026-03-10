const API_BASE = process.env.RPS_API_BASE
const TOKEN = process.env.RPS_API_TOKEN

if (!API_BASE) throw new Error("RPS_API_BASE is not defined in .env")
if (!TOKEN) throw new Error("RPS_API_TOKEN is not defined in .env")

export const fetchMatches = async <T>(endpoint: string): Promise<T> => {
  const url = `${API_BASE}${endpoint}`

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch ${endpoint}: ${res.status} ${res.statusText}`)
  }

  return res.json() as Promise<T>
}