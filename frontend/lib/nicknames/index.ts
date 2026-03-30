import { adjectives } from './adjectives'
import { colors } from './colors'
import { animals } from './animals'

const rand = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!

export const generateNickname = (): string =>
  `${rand(adjectives)}${rand(colors)}${rand(animals)}`
