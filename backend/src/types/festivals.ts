export type FestivalType =
  | 'SPARK'
  | 'GHOST'
  | 'SAFEGUARD'
  | 'RESONANCE'
  | 'SURGE'
  | 'VAULT'
  | 'FEVER'
  | 'SANGUINE'

export interface FestivalState {
  type: FestivalType
  startedAt: number
  flashType?: string | undefined
  endsAt: number
  triggeredBy: string
  isDemo?: boolean
}
