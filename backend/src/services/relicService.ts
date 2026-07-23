import pool from '../utils/db.js'
import { getActiveFestival } from './festivalService.js'
import { logger } from '../utils/logger.js'

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

export const RELICS: RelicDef[] = [
  {
    key: 'precision_bearing',
    name: 'Precision Bearing',
    rarity: 'COMMON',
    icon: 'Settings',
    effect: '+10% Tiered Bonus trigger chance',
  },
  {
    key: 'conductive_filament',
    name: 'Conductive Filament',
    rarity: 'COMMON',
    icon: 'Zap',
    effect: 'Reduces point losses by 5%',
  },
  {
    key: 'scavengers_lens',
    name: "The Scavenger's Lens",
    rarity: 'COMMON',
    icon: 'Search',
    effect: '+20% relic drop rates',
  },
  {
    key: 'lunar_siphon',
    name: 'Lunar Siphon',
    rarity: 'RARE',
    icon: 'Moon',
    effect:
      "+50% Moon's Blessing spawn rate. Adds +0.5x win multiplier if equipped when event starts.",
  },
  {
    key: 'static_inductor',
    name: 'Static Inductor',
    rarity: 'RARE',
    icon: 'CloudLightning',
    effect:
      '+50% Electric Surge spawn rate. Adds +0.5x win multiplier if equipped when event starts.',
  },
  {
    key: 'dealers_hand',
    name: "Dealer's Hand",
    rarity: 'RARE',
    icon: 'Spade',
    effect:
      '+50% Luck in the Card spawn rate. Adds +0.3x win multiplier if equipped when event starts.',
  },
  {
    key: 'volcanic_mantle',
    name: 'Volcanic Mantle',
    rarity: 'RARE',
    icon: 'Flame',
    effect:
      '+50% Hellfire spawn rate. Adds +0.5x win multiplier if equipped when event starts.',
  },
  {
    key: 'cobalt_core',
    name: 'Cobalt Core',
    rarity: 'RARE',
    icon: 'Cpu',
    effect: '+15% Flash Event appearance rate',
  },
  {
    key: 'biased_oscillator',
    name: 'Biased Oscillator',
    rarity: 'RARE',
    icon: 'Waves',
    effect: '+10% increased chance for Epic and Legendary bonuses',
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
      'Flash Events triggered while equipped grant an additional +0.5x multiplier.',
  },
  {
    key: 'prismatic_shard',
    name: 'Prismatic Shard',
    rarity: 'LEGENDARY',
    icon: 'Gem',
    effect: '+0.5x win multiplier while no Flash Event is active',
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
    effect: '5% chance for wins to pay out 3x rewards',
  },
  {
    key: 'temporal_anchor',
    name: 'Temporal Anchor',
    rarity: 'MYTHICAL',
    icon: 'Anchor',
    effect: 'Flash Events triggered while equipped last 4 rounds instead of 3.',
  },
  {
    key: 'architects_keystone',
    name: "The Architect's Keystone",
    rarity: 'MYTHICAL',
    icon: 'Diamond',
    effect: 'Triggered bonus rarity auto-upgrades to next tier',
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

function getLapBonus(rarity: RelicRarity, userLaps: number) {
  const caps: Record<RelicRarity, { perLap: number; max: number }> = {
    COMMON: { perLap: 0.005, max: 0.15 },
    RARE: { perLap: 0.002, max: 0.05 },
    EPIC: { perLap: 0.0008, max: 0.02 },
    LEGENDARY: { perLap: 0.0003, max: 0.01 },
    MYTHICAL: { perLap: 0.0001, max: 0.002 }
  }

  const cfg = caps[rarity]

  const bonus = userLaps * cfg.perLap
  return Math.min(bonus, cfg.max)
}

async function logRelicDrop(userId: string, relic: RelicDef) {
  try {
    const userRes = await pool.query(
      'SELECT nickname FROM users WHERE user_id = $1',
      [userId]
    )
    const nickname = userRes.rows[0]?.nickname ?? 'Anonymous'

    logger.info('Relic dropped', {
      nickname,
      userId,
      relicName: relic.name,
      rarity: relic.rarity,
      relicKey: relic.key
    })
  } catch (err) {
    logger.warn('Failed to log relic drop event details', {
      userId,
      error: String(err)
    })
  }
}

/**
 * Evaluates and processes relic drops using a single-roll cumulative probability model.
 * 
 * Logic:
 * 1. Grants first-time players a 25% welcome drop chance to find their very first Common relic.
 * 2. Compiles independent, non-overlapping drop rates for each rarity tier (factoring in Lap bonuses, 
 *    Scavenger's Lens, and Vault Festival multipliers) and tests them against a single random float.
 * 3. Maps the roll to its corresponding rarity range, ensuring no tier interferes with another's rate.
 * 4. Applies a "Smart Loot" fallback: if the selected rarity is fully collected, the system 
 *    gracefully searches outward starting with more common tiers first to preserve the economic rarity 
 *    of high-tier items (such as Mythicals), wrapping around to rarer tiers only as a last resort.
 */
export async function rollRelicDrop(
  userId: string,
  equippedRelicsKeys: string[],
  userLaps: number = 0
): Promise<RelicDef | null> {
  const owned = await pool.query(
    'SELECT relic_key FROM relics WHERE user_id = $1',
    [userId]
  )

  const ownedKeys = new Set(
    owned.rows.map((r: { relic_key: string }) => r.relic_key)
  )
  const isFirstRelicEver = ownedKeys.size === 0
  const vaultMultiplier = getActiveFestival()?.type === 'VAULT' ? 2.0 : 1.0
  const lensMultiplier = equippedRelicsKeys.includes('scavengers_lens')
    ? 1.2
    : 1.0
  const eligible = RELICS.filter(
    (r) => !ownedKeys.has(r.key) && !r.bossExclusive
  )
  if (eligible.length === 0) return null

  // First relic ever: 25% chance to get a common, picked randomly among commons
  if (isFirstRelicEver) {
    if (Math.random() < 0.25) {
      const commons = eligible.filter((r) => r.rarity === 'COMMON')
      const picked = commons[Math.floor(Math.random() * commons.length)]
      if (!picked) return null
      await pool.query(
        'INSERT INTO relics (user_id, relic_key, rarity, found_at) VALUES ($1, $2, $3, $4)',
        [userId, picked.key, picked.rarity, Date.now()]
      )

      await logRelicDrop(userId, picked)

      return picked
    }
    return null
  }

  // Exact base rates defined for each rarity tier
  const baseRates: Record<RelicRarity, number> = {
    MYTHICAL: 0.001, // 0.1%
    LEGENDARY: 0.002, // 0.2%
    EPIC: 0.003, // 0.3%
    RARE: 0.01, // 1.0%
    COMMON: 0.03 // 3.0%
  }

  // Calculate effective rates with active multipliers applied
  const mythicalRate =
    (baseRates.MYTHICAL + getLapBonus('MYTHICAL', userLaps)) *
    lensMultiplier *
    vaultMultiplier
  const legendaryRate =
    (baseRates.LEGENDARY + getLapBonus('LEGENDARY', userLaps)) *
    lensMultiplier *
    vaultMultiplier
  const epicRate =
    (baseRates.EPIC + getLapBonus('EPIC', userLaps)) *
    lensMultiplier *
    vaultMultiplier
  const rareRate =
    (baseRates.RARE + getLapBonus('RARE', userLaps)) *
    lensMultiplier *
    vaultMultiplier
  const commonRate =
    (baseRates.COMMON + getLapBonus('COMMON', userLaps)) *
    lensMultiplier *
    vaultMultiplier

  const totalRate =
    mythicalRate + legendaryRate + epicRate + rareRate + commonRate
  const roll = Math.random()

  if (roll < totalRate) {
    // Resolve the rolled rarity from the cumulative probability ranges.
    let selectedRarity: RelicRarity = 'COMMON'
    if (roll < mythicalRate) {
      selectedRarity = 'MYTHICAL'
    } else if (roll < mythicalRate + legendaryRate) {
      selectedRarity = 'LEGENDARY'
    } else if (roll < mythicalRate + legendaryRate + epicRate) {
      selectedRarity = 'EPIC'
    } else if (roll < mythicalRate + legendaryRate + epicRate + rareRate) {
      selectedRarity = 'RARE'
    }

    // Smart Loot fallback order.
    // Search toward more common tiers first to preserve high-tier rarity.
    const fallbackOrders: Record<RelicRarity, RelicRarity[]> = {
      MYTHICAL: ['MYTHICAL', 'LEGENDARY', 'EPIC', 'RARE', 'COMMON'],
      LEGENDARY: ['LEGENDARY', 'EPIC', 'RARE', 'COMMON', 'MYTHICAL'],
      EPIC: ['EPIC', 'RARE', 'COMMON', 'LEGENDARY', 'MYTHICAL'],
      RARE: ['RARE', 'COMMON', 'EPIC', 'LEGENDARY', 'MYTHICAL'],
      COMMON: ['COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHICAL']
    }

    const fallbackOrder = fallbackOrders[selectedRarity]
    let picked: RelicDef | null = null

    // Award the first available relic in the fallback order.
    for (const rarity of fallbackOrder) {
      const unownedOfRarity = eligible.filter((r) => r.rarity === rarity)
      if (unownedOfRarity.length > 0) {
        picked =
          unownedOfRarity[Math.floor(Math.random() * unownedOfRarity.length)]!
        break
      }
    }

    if (picked) {
      await pool.query(
        'INSERT INTO relics (user_id, relic_key, rarity, found_at) VALUES ($1, $2, $3, $4)',
        [userId, picked.key, picked.rarity, Date.now()]
      )

      await logRelicDrop(userId, picked)

      return picked
    }
  }

  return null
}

export async function getUserRelics(userId: string): Promise<RelicDef[]> {
  const result = await pool.query(
    'SELECT relic_key, counter FROM relics WHERE user_id = $1 ORDER BY found_at ASC',
    [userId]
  )

  return result.rows
    .map((row: any): RelicDef | null => {
      const staticDef = RELIC_MAP[row.relic_key]
      if (!staticDef) return null

      return {
        ...staticDef,
        counter: Number(row.counter || 0)
      }
    })
    .filter((relic): relic is RelicDef => relic !== null)
}

export async function equipRelicToSlot(
  userId: string,
  relicKey: string,
  slotIndex: number
): Promise<void> {
  const owned = await pool.query(
    'SELECT id FROM relics WHERE user_id = $1 AND relic_key = $2',
    [userId, relicKey]
  )
  if (owned.rows.length === 0) throw new Error('Relic not owned')

  const current = await pool.query(
    'SELECT equipped_relics FROM users WHERE user_id = $1',
    [userId]
  )
  const slots: (string | null)[] = current.rows[0]?.equipped_relics ?? [
    null,
    null,
    null
  ]
  while (slots.length < 3) slots.push(null)

  // Remove from any existing slot first (no duplicate keys)
  const existingSlot = slots.findIndex((k) => k === relicKey)
  if (existingSlot !== -1 && existingSlot !== slotIndex)
    slots[existingSlot] = null

  slots[slotIndex] = relicKey

  await pool.query(
    `UPDATE users SET equipped_relics = $1, equipped_relic = $2 WHERE user_id = $3`,
    [slots, slots[0] ?? null, userId]
  )
}

export async function unequipRelicFromSlot(
  userId: string,
  slotIndex: number
): Promise<void> {
  const current = await pool.query(
    'SELECT equipped_relics FROM users WHERE user_id = $1',
    [userId]
  )
  const slots: (string | null)[] = current.rows[0]?.equipped_relics ?? [
    null,
    null,
    null
  ]
  while (slots.length < 3) slots.push(null)

  const relicKey = slots[slotIndex]
  slots[slotIndex] = null

  if (relicKey) {
    await pool.query(
      'UPDATE relics SET counter = 0 WHERE user_id = $1 AND relic_key = $2',
      [userId, relicKey]
    )
  }

  await pool.query(
    `UPDATE users SET equipped_relics = $1, equipped_relic = $2 WHERE user_id = $3`,
    [slots, slots[0] ?? null, userId]
  )
}

export const equipRelic = (userId: string, relicKey: string) =>
  equipRelicToSlot(userId, relicKey, 0)
export const unequipRelic = (userId: string) => unequipRelicFromSlot(userId, 0)
