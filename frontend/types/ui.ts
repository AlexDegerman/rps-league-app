export type BrandTheme = 'LUNAR' | 'ELECTRIC' | 'CARDS' | 'HELLFIRE'

export type PopupKind =
  | 'flash_event'
  | 'ascension'
  | 'achievement'
  | 'relic_drop'
  | 'global_event'

export interface PopupQueueItem {
  id: string
  kind: PopupKind
  priority: number
  payload?: unknown
}
