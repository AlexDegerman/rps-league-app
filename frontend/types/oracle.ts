export interface OracleResponse {
  result?: string
  source?: string
  cached?: boolean
  error?: string
}

export interface OracleTickerMessage {
  id: string
  content: React.ReactNode
  speech?: string
  accentColor?: string
  durationMs?: number
}

