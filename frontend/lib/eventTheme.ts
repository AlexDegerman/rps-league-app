export type EventTheme = 'LUNAR' | 'ELECTRIC' | 'CARDS' | 'HELLFIRE' | null

export const BRAND_EVENT: EventTheme = null

let _liveEventTheme: EventTheme = null

export const getLiveEventTheme = () => _liveEventTheme
export const setLiveEventTheme = (t: EventTheme) => {
  _liveEventTheme = t
}
