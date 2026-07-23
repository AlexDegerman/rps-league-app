import type { WorldBossType } from '@/types/rps'

const ORACLE_WORLD_BOSS_WARNING_SPEECH: Record<WorldBossType, string[]> = {
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

export const buildWorldBossWarningSpeech = (type: WorldBossType): string => {
  const messages = ORACLE_WORLD_BOSS_WARNING_SPEECH[type]
  return messages[Math.floor(Math.random() * messages.length)]!
}
