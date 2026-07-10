import { securityResponses } from './securityResponses.js'
import { matchResolution } from './matchResolution.js'
import { faq } from './faq.js'
import { strategy } from './strategy.js'
import { pwaAndIdentity } from './pwaAndIdentity.js'
import { flashEvents } from './flashEvents.js'
import { globalEvents } from './globalEvents.js'
import { festivals } from './festivals.js'
import { progression } from './progression.js'
import { relics } from './relics.js'
import { achievements } from './achievements.js'
import { controls } from './controls.js'
import { futureContent } from './futureContent.js'

export const GAME_KNOWLEDGE = [
  securityResponses,
  matchResolution,
  faq,
  strategy,
  pwaAndIdentity,
  flashEvents,
  globalEvents,
  festivals,
  progression,
  relics,
  achievements,
  controls,
  futureContent
].join('\n\n')
