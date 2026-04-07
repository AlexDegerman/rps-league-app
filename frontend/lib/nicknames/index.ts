import { adjectives } from './adjectives'
import { colors } from './colors'
import { animals } from './animals'

const rand = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!

// Combines three word lists to give ~millions of unique combinations
// without needing a backend or database lookup
export const generateNickname = (): string =>
  `${rand(adjectives)}${rand(colors)}${rand(animals)}`
