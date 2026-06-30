import { flashEvents } from './flashEvents.js'
import { globalEvents } from './globalEvents.js'
import { festivals } from './festivals.js'
import { progression } from './progression.js'
import { relics } from './relics.js'
import { achievements } from './achievements.js'
import { controls } from './controls.js'
import { futureContent } from './futureContent.js'
import { faq } from './faq.js'
import { matchResolution } from './matchResolution.js'
import { pwaAndIdentity } from './pwaAndIdentity.js'

export const GAME_KNOWLEDGE = [
  matchResolution,
  faq,
  flashEvents,
  globalEvents,
  festivals,
  progression,
  relics,
  achievements,
  controls,
  futureContent,
  pwaAndIdentity
].join('\n\n')
