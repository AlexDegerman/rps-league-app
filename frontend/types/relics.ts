export type RelicRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHICAL'

export interface RelicDef {
  key: string
  name: string
  rarity: RelicRarity
  icon: string
  effect: string
  threshold?: number
  counter?: number
  bossExclusive?: boolean
}