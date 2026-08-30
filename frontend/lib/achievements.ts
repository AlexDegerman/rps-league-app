import { CATEGORY_CHAINS, STANDALONE_CATEGORIES, ACHIEVEMENT_BADGE_MAP } from "@/constants/achievements"
import { BadgeData } from "@/types/leaderboard"

/**
 * Resolves visible selections for the user badge showcases.
 */
export function getHighestEarnedPerCategory(earned: Set<string>): BadgeData[] {
  const result: BadgeData[] = []

  for (const [cat, chain] of Object.entries(CATEGORY_CHAINS)) {
    if (STANDALONE_CATEGORIES.has(cat)) {
      for (const code of chain) {
        if (earned.has(code)) {
          const def = ACHIEVEMENT_BADGE_MAP[code]
          if (def) result.push(def)
        }
      }
    } else {
      let highest: BadgeData | null = null
      for (const code of chain) {
        if (earned.has(code)) {
          const def = ACHIEVEMENT_BADGE_MAP[code]
          if (def) highest = def
        }
      }
      if (highest) result.push(highest)
    }
  }

  return result
}

