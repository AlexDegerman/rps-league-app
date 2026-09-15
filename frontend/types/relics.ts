export type RelicRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHICAL'
export type LoadoutType = 'prediction' | 'world_boss' | 'neon_paradise'

export interface RelicDef {
  key: string
  name: string
  rarity: RelicRarity
  icon: string
  effect: string
  threshold?: number
  counter?: number
  bossExclusive?: boolean
  category?: LoadoutType
}
