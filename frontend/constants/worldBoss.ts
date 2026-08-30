import { WorldBossType } from "@/types/worldboss"

export const BOSS_EFFECT_TEXT: Record<string, string> = {
  HEXURION:
    'HEXURION ACTIVE - STRUCTURAL LATTICE ONLINE - CORRECT PREDICTIONS STRIKE THE BOSS',
  ORPHION:
    'ORPHION ACTIVE - ORBITAL CONVERGENCE LOCKED - CORRECT PREDICTIONS STRIKE THE BOSS',
  FRACTURON:
    'FRACTURON ACTIVE - FRACTAL MATRIX ONLINE - CORRECT PREDICTIONS STRIKE THE BOSS',
  APEXION:
    'APEXION ACTIVE - KINETIC COMPRESSION RISING - CORRECT PREDICTIONS STRIKE THE BOSS'
}

export const BOSS_COLORS: Record<string, string> = {
  HEXURION: '#22d3ee',
  ORPHION: '#a855f7',
  FRACTURON: '#22c55e',
  APEXION: '#f97316'
}

export const ORACLE_WORLD_BOSS_WARNING_SPEECH: Record<WorldBossType, string[]> = {
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

