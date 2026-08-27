export const relics = `
SYSTEM DEFINITIONS: RELIC SYSTEM

Relics are permanent collectible gameplay modifiers that introduce long-term account progression, strategic specialization, and increasingly unstable endgame spectacle into RPS League.

Unlike temporary Flash Events, relics persist across sessions and fundamentally alter prediction strategies, event targeting, streak preservation, and high-tier multiplier scaling.

Each player may equip up to three active relics simultaneously.

CORE DESIGN PRINCIPLES:
- Long-term account progression
- Build experimentation and specialization
- Increasingly unstable endgame spectacle
- Permanent collection with no duplicates

DROP SYSTEM:
- Relics drop after completed predictions, regardless of win or loss.
- Each completed prediction performs exactly one cumulative loot roll.
- A successful roll determines the rarity tier and then selects one unowned relic from that tier.
- Each relic can only be obtained once.
- Obtained relics are permanently added to the account and removed from future drop pools.
- Smart Loot redirects drops when the selected rarity has been fully collected.
- World Boss exclusive relics never appear in prediction drop rolls.
- World Boss exclusive relics are only obtainable through World Boss chest rewards.
- Prediction drop rates are modified by Lap progression and active relic-based acquisition effects.

DROP RATES & PROGRESSION SCALE:
- Common: 3% base + 0.5% per lap, capped at +15%
- Rare: 1% base + 0.2% per lap, capped at +5%
- Epic: 0.3% base + 0.08% per lap, capped at +2%
- Legendary: 0.2% base + 0.03% per lap, capped at +1%
- Mythical: 0.1% base + 0.01% per lap, capped at +0.2%

WORLD BOSS EXCLUSIVE RELICS:
- 14 relics exist outside the standard prediction drop pool.
- They are obtainable only through World Boss chest rewards.
- They are not affected by The Scavenger's Lens or Vault Festival multipliers.
- Their effects specialize in World Boss chest point rewards, relic appearance chance, and chest upgrade chance.
- Chest point bonuses are flat additive modifiers applied to World Boss chest point rewards.
- Relic appearance bonuses increase the chance for a World Boss relic to appear inside a chest.
- Upgrade bonuses increase the chance for a chest to upgrade by one rarity after its base rarity is determined.
- Upgrade relics can raise chests from Common through Mythical.
- Rainbow tier requires Prism Key equipped alongside any chest upgrade relic.
- Upgrade rolls are calculated individually for each player using their equipped relics at reward distribution.
- Twin Fortune has a 25% chance to duplicate the earned World Boss chest.
- A duplicated chest receives an independent relic roll.
- Twin Fortune's two relic drops are guaranteed to use different relic keys.
- Both chest rewards are combined into a single payout.

SOCKET COMMITMENT & ANTI-SWAP:
- Players may equip up to three relics simultaneously.
- Flash Event bonuses are snapshotted when the event begins.
- Equipping a relevant relic after a Flash Event has already started has no retroactive effect.
- Applies to Lunar Siphon, Static Inductor, Dealer's Hand, Volcanic Mantle, Overdrive Relay, and Temporal Anchor.
- Charge relic progress only accumulates while the relic is equipped.
- Unequipping a charge relic pauses its progress and resets its stored counter state.
- Applies to Buffer Module, Kinetic Capacitor, and Logic Gate.
- Relic equipping and unequipping is completely blocked during active World Boss encounters.
- World Boss loadouts lock when the encounter starts and become interactive again after rewards are distributed.

RELIC UI:
- Three relic slots are permanently visible in the main gameplay header.
- Each slot displays its equipped relic or an empty state.
- Slot capacity remains visible even when no relic is equipped.
- Tapping a slot opens the Relic Drawer.
- The Relic Drawer displays the complete inventory grouped by rarity.
- The drawer includes an active slot summary showing all three slots.
- Equipping a relic allows the player to select which of the three slots receives it.
- Relics can be equipped or removed from the drawer.
- Relic interaction is locked during active World Boss encounters.
- Public profiles display all equipped relics.
- Up to three equipped relics are shown on public profiles with rarity-matched styling.

RELIC CATALOGUE:

COMMON:
- Precision Bearing: +10% Tiered Bonus trigger chance.
- Conductive Filament: Reduces point loss by 5%.
- The Scavenger's Lens: +20% relic acquisition rate.
- Fortune Satchel: +25% World Boss Chest point rewards.
- Treasure Compass: +25% chance for a World Boss relic to appear in a World Boss Chest.
- Lucky Crest: +10% chance for a World Boss Chest to upgrade by one rarity, up to Mythical.

RARE:
- Lunar Siphon: +50% Moon event rate and +0.5x Flash Event multiplier.
- Static Inductor: +50% Electric Surge rate and +0.5x Flash Event multiplier.
- Dealer's Hand: +50% Card event rate and +0.3x Flash Event multiplier.
- Volcanic Mantle: +50% Hellfire rate and +0.5x Flash Event multiplier.
- Cobalt Core: +25% overall Flash Event appearance rate.
- Biased Oscillator: +10% Epic/Legendary Tiered Bonus chance.
- King's Purse: +50% World Boss Chest point rewards.
- Relic Magnet: +50% chance for a World Boss relic to appear in a World Boss Chest.
- Fortune Seal: +20% chance for a World Boss Chest to upgrade by one rarity, up to Mythical.

EPIC:
- Buffer Module: Every 15 matches, the next loss does not reset the win streak.
- Overdrive Relay: +0.5x multiplier during Flash Events.
- Royal Treasury: +100% World Boss Chest point rewards.
- Vault Key: +100% chance for a World Boss relic to appear in a World Boss Chest.
- Ascension Sigil: +35% chance for a World Boss Chest to upgrade by one rarity, up to Mythical.

LEGENDARY:
- Prismatic Shard: +0.5x multiplier when no Flash Event is active.
- Kinetic Capacitor: Every 30 wins, the next win gains an x2 multiplier.
- Logic Gate: Every 20 wins, the next win guarantees a Legendary Tiered Bonus.
- Dragon's Hoard: +150% World Boss Chest point rewards.
- Collector's Vault: +150% chance for a World Boss relic to appear in a World Boss Chest.
- Celestial Crown: +50% chance for a World Boss Chest to upgrade by one rarity, up to Mythical.

MYTHICAL:
- Soul of the Machine: 5% chance for a 3x reward multiplier.
- Temporal Anchor: Flash Events last +1 round, for 4 rounds total.
- The Architect's Keystone: Upgrades triggered Tiered Bonuses to the next rarity and unlocks the Mythical x15 bonus tier.
- Twin Fortune: 25% chance to duplicate the earned World Boss Chest. Both rewards receive independent relic rolls and are combined into one payout.
- Prism Key: Enables the Rainbow Chest tier when equipped alongside any chest-upgrade relic. Does not increase upgrade chance by itself.

MYTHICAL BONUS TIER:
- The Architect's Keystone can unlock the Mythical x15 Tiered Bonus.
- Visual traits include crimson bloom, instability flicker, red particle eruptions, and heavy motion trails.

MULTIPLIER SLAM SYSTEM:
- Triggered by high-tier relic multiplier procs such as x2 and x3.
- The normal result flow is interrupted and the final payout is replayed as a staged impact sequence.
- Base result resolves into a locked pre-slam state.
- Freeze frame triggers during the impact timing window.
- Animated multiplier badge enters with weighted drop and impact feedback.
- Payout value then ticks upward until the final boosted total is reached.

X2 SLAM:
- Large orange x2 multiplier drops with weighted fall animation.
- Brief impact freeze frame locks the result state.
- Subtle screen shake emphasizes the landing.
- Multiplier remains visible throughout the payout climb.
- Value ticks upward into the final boosted total.

X3 SLAM:
- Enhanced red-tier version of the x2 slam.
- Heavier drop inertia and stronger visual recoil.
- Longer freeze window before payout begins.
- Deeper glow stack with expanded bloom and saturation spike.
- Extended ticker duration for the payout reveal.
- Designed to feel heavier, slower, and more unstable than x2.

AUDIO SYSTEM:
- Metallic slam: impact cue.
- Coin cascade: payout acceleration.
- Shimmer ring: resolution finish.

RELIC DROP PRESENTATION:
- Prediction relic drops display a "RELIC FOUND" popup.
- Rarity-matched animated backgrounds accompany the popup.
- The relic is automatically added to inventory.
- Player can choose Equip or Dismiss.
- Equip opens the three-slot selector.
- Dismiss closes the popup while retaining the relic in inventory.
- World Boss chest relics display the chest opening animation first.
- Relic popup appears after the chest reward resolves.
- Twin Fortune can produce two sequential relic popups when both chest rewards contain relics.
- The same Equip or Dismiss flow applies to World Boss relics.

DESIGN PHILOSOPHY:
- Relics provide build identity and long-term progression at extreme point scales.
- Permanent collection prevents duplicate farming.
- Controlled randomness creates rarity progression without duplicate frustration.
- Relic effects create strategic specialization across prediction and World Boss systems.
- World Boss exclusive relics provide a separate specialization axis from the prediction meta.
- Point bonus relics improve chest rewards.
- Relic appearance relics accelerate World Boss relic collection.
- Upgrade relics shift expected chest rarity upward.
- Twin Fortune and Prism Key represent high-end World Boss chase mechanics.
- The relic system combines persistent progression, build experimentation, cooperative World Boss specialization, and high-impact spectacle.
`
