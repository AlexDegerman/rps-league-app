export type GlobalEventType =
  | 'TIDAL_SURGE'
  | 'SOLAR_FLARE'
  | 'CYCLONE_BLITZ'
  | 'MIRAGE_CATACLYSM'

export type GlobalEventPhase = 'warning' | 'active'

export interface GlobalEventState {
  type: GlobalEventType
  phase: GlobalEventPhase
  startedAt: number
  activeAt: number
  endsAt: number
  triggeredAt: number
}

export interface GlobalEventBuffResult {
  gainLossMultiplied: bigint
  echoAmount: bigint
  buffType: GlobalEventType | null
  echoFactor?: number
}
