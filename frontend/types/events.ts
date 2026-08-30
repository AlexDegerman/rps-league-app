export type EventTheme = 'LUNAR' | 'ELECTRIC' | 'CARDS' | 'HELLFIRE' | null

export type FlashModeKey =
  | 'flash_lunar'
  | 'flash_electric'
  | 'flash_cards'
  | 'flash_hellfire'

export type FestivalType =
  | 'SPARK'
  | 'GHOST'
  | 'SAFEGUARD'
  | 'RESONANCE'
  | 'SURGE'
  | 'VAULT'
  | 'FEVER'
  | 'SANGUINE'

export type FestivalModeKey =
  | 'festival_spark'
  | 'festival_ghost'
  | 'festival_safeguard'
  | 'festival_resonance'
  | 'festival_surge'
  | 'festival_vault'
  | 'festival_fever'
  | 'festival_sanguine'

export type WinStreakModeKey = 'winstreak_inferno' | 'winstreak_fever'

export type BossModeKey =
  | 'boss_hexurion'
  | 'boss_orphion'
  | 'boss_fracturon'
  | 'boss_apexion'

export type GlobalEventType =
  | 'TIDAL_SURGE'
  | 'SOLAR_FLARE'
  | 'CYCLONE_BLITZ'
  | 'MIRAGE_CATACLYSM'

export type GlobalEventPhase = 'warning' | 'active'

export type GlobalEventModeKey =
  | 'global_tidal_surge'
  | 'global_solar_flare'
  | 'global_cyclone_blitz'
  | 'global_mirage_cataclysm'

export type VisualMode =
  | FlashModeKey
  | GlobalEventModeKey
  | FestivalModeKey
  | WinStreakModeKey
  | BossModeKey
  | null

export interface FestivalSSEData {
  type: string
  startedAt: number
  endsAt: number | null
  durationMs: number
  message: string
  flashType?: string
  isDemo: boolean
  triggerUserId?: string
  triggeredBy?: string
  speech?: string
}

export interface GlobalEventWarningSSEData {
  type: GlobalEventType
  phase: 'warning'
  startedAt: number
  activeAt: number
  endsAt: number
  message: string
  speech?: string
}

export interface GlobalEventStartSSEData {
  type: GlobalEventType
  phase: 'active'
  startedAt: number
  activeAt: number
  endsAt: number
}

export interface GlobalEventStateResponse {
  event: {
    type: GlobalEventType
    phase: GlobalEventPhase
    activeAt: number
    endsAt: number
    startedAt: number
  } | null
}
