export type FlashEventType = 'LUNAR' | 'ELECTRIC' | 'CARDS' | 'HELLFIRE'

export interface FlashEventState {
  type: FlashEventType
  multiplier: number
  betsRemaining: number
  triggeredAt: number
  expiresAt?: number
  isFestival?: boolean
  snapshotRelic: string | null
}
