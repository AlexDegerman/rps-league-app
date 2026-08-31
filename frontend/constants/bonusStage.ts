import { StageType } from '@/types/bonusStage'

export const STAGE_DISPLAY_NAMES: Record<StageType, string> = {
  TREASURE_VAULT: 'TREASURE VAULT',
  KINGS_VAULT: "KING'S VAULT",
  DOUBLE_DOWN: 'DOUBLE DOWN',
  WILD_PREDICTION: 'WILD PREDICTION',
  SURGE_FRENZY: 'SURGE FRENZY',
  RAINBOW_RUSH: 'RAINBOW RUSH',
  SNIPER_CHALLENGE: 'SNIPER CHALLENGE',
  ORACLE_VISION: 'ARKALON VISION',
  CRYSTAL_MINE: 'CRYSTAL MINE'
}

export const ORACLE_VOICE_LINES: Record<StageType, string> = {
  TREASURE_VAULT: 'A vault... has materialized... claim what awaits...',
  KINGS_VAULT: 'The vaults... of the king... have opened...',
  DOUBLE_DOWN: 'Risk... and reward... entangled...',
  WILD_PREDICTION: 'The cards... have chosen... to speak...',
  SURGE_FRENZY: 'The storm... remembers your name...',
  RAINBOW_RUSH: 'Colors... beyond prediction threshold...',
  SNIPER_CHALLENGE: 'One shot... one moment... make it count...',
  ORACLE_VISION: 'The glyphs... demand... to be remembered...',
  CRYSTAL_MINE: 'The crystal depths... awaken...'
}