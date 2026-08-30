import type { WorldBossType, ChestRarity } from '../types/worldBoss.js'

export const WORLD_BOSS_ENABLED = true

export const WORLD_BOSS_COOLDOWN_MIN_MS = 10 * 60 * 1000
export const WORLD_BOSS_COOLDOWN_MAX_MS = 12 * 60 * 1000
export const WORLD_BOSS_WARNING_DURATION_MS = 30 * 1000
export const WORLD_BOSS_QUIET_DURATION_MS = 60 * 1000
export const WORLD_BOSS_ENCOUNTER_DURATION_MS = 60 * 1000

export const BOSS_POOL: WorldBossType[] = [
  'HEXURION',
  'ORPHION',
  'FRACTURON',
  'APEXION'
]

export const CHEST_RELIC_DROP_CHANCE: Record<ChestRarity, number> = {
  COMMON: 0.05,
  RARE: 0.1,
  EPIC: 0.2,
  LEGENDARY: 0.3,
  MYTHICAL: 0.5,
  RAINBOW: 1.0
}

export const CHEST_RELIC_RARITY_WEIGHTS = [
  { rarity: 'COMMON' as const, weight: 50 },
  { rarity: 'RARE' as const, weight: 28 },
  { rarity: 'EPIC' as const, weight: 15 },
  { rarity: 'LEGENDARY' as const, weight: 6 },
  { rarity: 'MYTHICAL' as const, weight: 1 }
]

export const BOSS_WARNING_MESSAGES: Record<WorldBossType, string[]> = {
  HEXURION: [
    'Structural... lattice... awakening. Hexurion... assembling.',
    'Hard-light... geometry... stabilizing. Hexurion... emergence... imminent.',
    'Sentinel... protocol... activated. Hexurion... approaches.'
  ],
  ORPHION: [
    'Gravitational... anomaly... detected. Orphion... descending.',
    'Orbital... convergence... accelerating. Orphion... approaches.',
    'Singularity... forming. Orphion... emergence... imminent.'
  ],
  FRACTURON: [
    'Data... lattice... corruption... detected. Fracturon... materializing.',
    'Fractal... instability... rising. Fracturon... boot... sequence... initiated.',
    'Dimensional... refraction... increasing. Fracturon... approaches.'
  ],
  APEXION: [
    'Monolith... energy... signature... detected. Apexion... awakening.',
    'Kinetic... compression... exceeding... limits. Apexion... emergence... imminent.',
    'Zenith... core... destabilizing. Apexion... approaches.'
  ]
}
