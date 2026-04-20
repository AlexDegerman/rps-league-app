'use client'
import { createContext, useContext, useState } from 'react'

export type EventTheme = 'LUNAR' | 'ELECTRIC' | 'CARDS' | 'HELLFIRE' | null
export type VisualMode =
  | 'flash_lunar'
  | 'flash_electric'
  | 'flash_cards'
  | 'flash_hellfire'
  | 'inferno'
  | 'fever'
  | null

// Hardcoded to newest event added to app — only for "RPS League" brand text
export const BRAND_EVENT: EventTheme = 'LUNAR'

interface EventThemeCtx {
  liveTheme: EventTheme
  visualMode: VisualMode
  setLiveTheme: (t: EventTheme) => void
  setVisualMode: (m: VisualMode) => void
  brandTheme: EventTheme
}

const EventThemeContext = createContext<EventThemeCtx>({
  liveTheme: null,
  visualMode: null,
  setLiveTheme: () => {},
  setVisualMode: () => {},
  brandTheme: BRAND_EVENT
})

export const EventThemeProvider = ({
  children
}: {
  children: React.ReactNode
}) => {
  const [liveTheme, setLiveTheme] = useState<EventTheme>(null)
  const [visualMode, setVisualMode] = useState<VisualMode>(null)
  return (
    <EventThemeContext.Provider
      value={{
        liveTheme,
        visualMode,
        setLiveTheme,
        setVisualMode,
        brandTheme: BRAND_EVENT
      }}
    >
      {children}
    </EventThemeContext.Provider>
  )
}

export const useEventTheme = () => useContext(EventThemeContext)
