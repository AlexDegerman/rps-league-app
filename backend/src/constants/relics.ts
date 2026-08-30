import type { RelicDef } from '../types/relics.js'

export const RELICS: RelicDef[] = [
  {
    key: 'precision_bearing',
    name: 'Precision Bearing',
    rarity: 'COMMON',
    icon: 'Settings',
    effect: '+10% Tiered Bonus trigger chance'
  },
  {
    key: 'conductive_filament',
    name: 'Conductive Filament',
    rarity: 'COMMON',
    icon: 'Zap',
    effect: 'Reduces point losses by 5%'
  },
  {
    key: 'scavengers_lens',
    name: "The Scavenger's Lens",
    rarity: 'COMMON',
    icon: 'Search',
    effect: '+20% relic drop rates'
  },
  {
    key: 'lunar_siphon',
    name: 'Lunar Siphon',
    rarity: 'RARE',
    icon: 'Moon',
    effect:
      "+50% Moon's Blessing spawn rate. Adds +0.5x win multiplier if equipped when event starts."
  },
  {
    key: 'static_inductor',
    name: 'Static Inductor',
    rarity: 'RARE',
    icon: 'CloudLightning',
    effect:
      '+50% Electric Surge spawn rate. Adds +0.5x win multiplier if equipped when event starts.'
  },
  {
    key: 'dealers_hand',
    name: "Dealer's Hand",
    rarity: 'RARE',
    icon: 'Spade',
    effect:
      '+50% Luck in the Card spawn rate. Adds +0.3x win multiplier if equipped when event starts.'
  },
  {
    key: 'volcanic_mantle',
    name: 'Volcanic Mantle',
    rarity: 'RARE',
    icon: 'Flame',
    effect:
      '+50% Hellfire spawn rate. Adds +0.5x win multiplier if equipped when event starts.'
  },
  {
    key: 'cobalt_core',
    name: 'Cobalt Core',
    rarity: 'RARE',
    icon: 'Cpu',
    effect: '+15% Flash Event appearance rate'
  },
  {
    key: 'biased_oscillator',
    name: 'Biased Oscillator',
    rarity: 'RARE',
    icon: 'Waves',
    effect: '+10% increased chance for Epic and Legendary bonuses'
  },
  {
    key: 'buffer_module',
    name: 'Buffer Module',
    rarity: 'EPIC',
    icon: 'ShieldCheck',
    effect:
      "Every 15 matches while equipped, your next loss won't reset your streak",
    threshold: 15
  },
  {
    key: 'overdrive_relay',
    name: 'Overdrive Relay',
    rarity: 'EPIC',
    icon: 'Repeat',
    effect:
      'Flash Events triggered while equipped grant an additional +0.5x multiplier.'
  },
  {
    key: 'prismatic_shard',
    name: 'Prismatic Shard',
    rarity: 'LEGENDARY',
    icon: 'Gem',
    effect: '+0.5x win multiplier while no Flash Event is active'
  },
  {
    key: 'kinetic_capacitor',
    name: 'Kinetic Capacitor',
    rarity: 'LEGENDARY',
    icon: 'BatteryCharging',
    effect:
      'Every 30 wins while equipped, your next win gains an extra x2 multiplier.',
    threshold: 30
  },
  {
    key: 'logic_gate',
    name: 'Logic Gate',
    rarity: 'LEGENDARY',
    icon: 'CircuitBoard',
    effect:
      'Every 20 wins while equipped, your next win guarantees a Legendary Bonus.',
    threshold: 20
  },
  {
    key: 'soul_of_the_machine',
    name: 'Soul of the Machine',
    rarity: 'MYTHICAL',
    icon: 'Fingerprint',
    effect: '5% chance for wins to pay out 3x rewards'
  },
  {
    key: 'temporal_anchor',
    name: 'Temporal Anchor',
    rarity: 'MYTHICAL',
    icon: 'Anchor',
    effect: 'Flash Events triggered while equipped last 4 rounds instead of 3.'
  },
  {
    key: 'architects_keystone',
    name: "The Architect's Keystone",
    rarity: 'MYTHICAL',
    icon: 'Diamond',
    effect: 'Triggered bonus rarity auto-upgrades to next tier'
  },
  {
    key: 'fortune_satchel',
    name: 'Fortune Satchel',
    rarity: 'COMMON',
    icon: 'Backpack',
    effect: '+25% to World Boss Chest point rewards',
    bossExclusive: true
  },
  {
    key: 'treasure_compass',
    name: 'Treasure Compass',
    rarity: 'COMMON',
    icon: 'Compass',
    effect:
      '+25% chance for a World Boss relic to appear in a World Boss Chest',
    bossExclusive: true
  },
  {
    key: 'lucky_crest',
    name: 'Lucky Crest',
    rarity: 'COMMON',
    icon: 'BadgePlus',
    effect:
      '+10% chance for a World Boss Chest to upgrade by one rarity (up to Mythical)',
    bossExclusive: true
  },
  {
    key: 'kings_purse',
    name: "King's Purse",
    rarity: 'RARE',
    icon: 'Wallet',
    effect: '+50% to World Boss Chest point rewards',
    bossExclusive: true
  },
  {
    key: 'relic_magnet',
    name: 'Relic Magnet',
    rarity: 'RARE',
    icon: 'Magnet',
    effect:
      '+50% chance for a World Boss relic to appear in a World Boss Chest',
    bossExclusive: true
  },
  {
    key: 'fortune_seal',
    name: 'Fortune Seal',
    rarity: 'RARE',
    icon: 'Stamp',
    effect:
      '+20% chance for a World Boss Chest to upgrade by one rarity (up to Mythical)',
    bossExclusive: true
  },
  {
    key: 'royal_treasury',
    name: 'Royal Treasury',
    rarity: 'EPIC',
    icon: 'Landmark',
    effect: '+100% to World Boss Chest point rewards',
    bossExclusive: true
  },
  {
    key: 'vault_key',
    name: 'Vault Key',
    rarity: 'EPIC',
    icon: 'KeyRound',
    effect:
      '+100% chance for a World Boss relic to appear in a World Boss Chest',
    bossExclusive: true
  },
  {
    key: 'ascension_sigil',
    name: 'Ascension Sigil',
    rarity: 'EPIC',
    icon: 'Sparkles',
    effect:
      '+35% chance for a World Boss Chest to upgrade by one rarity (up to Mythical)',
    bossExclusive: true
  },
  {
    key: 'dragons_hoard',
    name: "Dragon's Hoard",
    rarity: 'LEGENDARY',
    icon: 'Gem',
    effect: '+150% to World Boss Chest point rewards',
    bossExclusive: true
  },
  {
    key: 'collectors_vault',
    name: "Collector's Vault",
    rarity: 'LEGENDARY',
    icon: 'Archive',
    effect:
      '+150% chance for a World Boss relic to appear in a World Boss Chest',
    bossExclusive: true
  },
  {
    key: 'celestial_crown',
    name: 'Celestial Crown',
    rarity: 'LEGENDARY',
    icon: 'Crown',
    effect:
      '+50% chance for a World Boss Chest to upgrade by one rarity (up to Mythical)',
    bossExclusive: true
  },
  {
    key: 'twin_fortune',
    name: 'Twin Fortune',
    rarity: 'MYTHICAL',
    icon: 'CopyPlus',
    effect: '25% chance to duplicate the earned World Boss Chest.',
    bossExclusive: true
  },
  {
    key: 'prism_key',
    name: 'Prism Key',
    rarity: 'MYTHICAL',
    icon: 'Diamond',
    effect:
      'Enables the Rainbow World Boss Chest tier when combined with chest upgrade relics.',
    bossExclusive: true
  }
]

export const RELIC_MAP = Object.fromEntries(RELICS.map((r) => [r.key, r]))