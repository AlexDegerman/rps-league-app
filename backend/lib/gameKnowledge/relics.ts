export const relics = `
SYSTEM DEFINITIONS: RELIC SYSTEM
Relics are permanent collectible gameplay modifiers discovered randomly through post-prediction drops. Players have duplicate protection (guaranteed no duplicates). One relic can be active/equipped at a time.

DROP RATES & PROGRESSION SCALE:
- Common (3% base + 0.5% per lap, max 18%)
- Rare (1% base + 0.2% per lap, max 6%)
- Epic (0.3% base + 0.08% per lap, max 2.3%)
- Legendary (0.2% base + 0.03% per lap, max 1.2%)
- Mythical (0.1% base + 0.01% per lap, max 0.3%)

SOCKET COMMITMENT & ANTI-SWAP:
- Flash event multipliers/durations are locked at trigger time. Equipping a relic mid-event has no retroactive effect.
- Relic progress counters (Buffer Module, Kinetic Capacitor, Logic Gate) pause and reset when unequipped.

RELIC CATALOGUE:
1. Common:
  - Precision Bearing: +10% Tiered Bonus trigger chance.
  - Conductive Filament: Reduces point loss by 5% (to -45% instead of -50%).
  - The Scavenger's Lens: +20% relic acquisition rate.
2. Rare:
  - Lunar Siphon: +50% Moon event rate, +0.5x flash multiplier.
  - Static Inductor: +50% Electric Surge rate, +0.5x flash multiplier.
  - Dealer's Hand: +50% Card event rate, +0.3x flash multiplier.
  - Volcanic Mantle: +50% Hellfire rate, +0.5x flash multiplier.
  - Cobalt Core: +25% overall Flash Event appearance rate.
  - Biased Oscillator: +10% Epic/Legendary tiered bonus chance.
3. Epic:
  - Buffer Module: Every 15 matches, next loss does not reset streak.
  - Overdrive Relay: +0.5x multiplier during Flash Events.
4. Legendary:
  - Prismatic Shard: +0.5x multiplier when no Flash Event is active.
  - Kinetic Capacitor: Every 30 wins, next win gains x2 multiplier.
  - Logic Gate: Every 20 wins, next win guarantees a Legendary tiered bonus.
5. Mythical:
  - Soul of the Machine: 5% chance for 3x reward multiplier (Mythic Slam).
  - Temporal Anchor: Flash Events last +1 round (4 rounds total).
  - The Architect's Keystone: Upgrades triggered tiered bonuses to the next rarity (unlocks Mythical x15 bonus tier).

MULTIPLIER SLAM SYSTEM:
Triggered on high-tier relic procs (x2 or x3). Pauses game state, freezes layout, and drops a giant animated badge before playing coin cascade SFX and rendering final payout.
`
