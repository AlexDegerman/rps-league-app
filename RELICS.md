# 🧿 Relic System

Relics are permanent collectible gameplay modifiers that introduce long-term account progression, strategic specialization, and increasingly unstable endgame spectacle into RPS League.

Unlike temporary Flash Events, relics persist across sessions and fundamentally alter how players approach prediction strategies, event targeting, streak preservation, and high-tier multiplier scaling.

Each player may equip one active relic at a time.

---

## Core Design Principles
- Long-term account progression
- Build experimentation and specialization
- Increasingly unstable endgame spectacle
- Permanent collection with no duplicates

---

## ⚙️ Drop System

Relics drop after completed predictions (win or loss). Each completed prediction performs a single cumulative loot roll that determines whether a relic drops and, if successful, which rarity tier is selected.

Once a relic is obtained, it is permanently added to the account and removed from future drop pools.

### Base Drop Rates (per roll)

| Rarity | Base Chance | Lap Scaling (capped) |
|---|---|---|
| 🟢 Common | 3% | +0.5% per lap (max +15%) |
| 🔵 Rare | 1% | +0.2% per lap (max +5%) |
| 🟣 Epic | 0.3% | +0.08% per lap (max +2%) |
| 🟡 Legendary | 0.2% | +0.03% per lap (max +1%) |
| 🔴 Mythical | 0.1% | +0.01% per lap (max +0.2%) |

### System Rules

- Each completed prediction performs exactly one cumulative loot roll
- Each rarity tier has a fixed base drop probability, modified by Lap bonuses and active drop-rate multipliers
- A successful roll selects one unowned relic from the chosen rarity tier
- If the selected rarity has been fully collected, Smart Loot redirects the drop according to the rarity fallback order
- Each relic can only be obtained once (duplicate protection)
- Lap scaling increases acquisition speed over long-term progression while remaining capped per rarity

---

## 🔒 The Anti-Swap Protocol (Socket Commitment)

To maintain balance, relic effects are bound to strict timing rules that prevent mid-event abuse.

### 1. Trigger Snapshots (Flash Events)
Flash Event bonuses (multipliers and duration) are locked at the moment the event triggers.

- If a relic is not equipped when the event starts, equipping it later will not apply its effect
- Applies to: Lunar Siphon, Static Inductor, Dealer's Hand, Volcanic Mantle, Overdrive Relay, Temporal Anchor

### 2. Socket-Locked Progress (Charge Relics)
Some relics accumulate progress only while actively equipped.

- Progress pauses when unequipped
- Unequipping resets stored counter state in live gameplay logic
- Applies to: Buffer Module, Kinetic Capacitor, Logic Gate

---

## 🧩 UI Architecture

### Primary Relic Slot
Always visible in the main gameplay header. Shows currently equipped relic and opens the Relic Drawer.

### Relic Drawer
Mobile-first overlay panel containing:
- Full inventory
- Equipped highlight
- Equip/unequip actions

### Profile Integration
Players display equipped relic publicly, enabling build comparison across leaderboards.

---

## 🧿 Relic Catalogue

### 🟢 Common

| Relic | Icon | Effect |
|---|---|---|
| Precision Bearing | Settings | +10% Tiered Bonus trigger chance |
| Conductive Filament | Zap | Reduces point loss by 5% |
| The Scavenger's Lens | Search | +20% relic acquisition rate |

---

### 🔵 Rare

| Relic | Icon | Effect |
|---|---|---|
| Lunar Siphon | Moon | +50% Moon event rate + 0.5x multiplier |
| Static Inductor | CloudLightning | +50% Electric Surge rate + 0.5x multiplier |
| Dealer's Hand | Spade | +50% Card event rate + 0.3x multiplier |
| Volcanic Mantle | Flame | +50% Hellfire rate + 0.5x multiplier |
| Cobalt Core | Cpu | +25% Flash Event appearance rate |
| Biased Oscillator | Waves | +10% Epic/Legendary bonus chance |

---

### 🟣 Epic

| Relic | Icon | Effect |
|---|---|---|
| Buffer Module | ShieldCheck | Every 15 matches, next loss does not reset streak |
| Overdrive Relay | Repeat | +0.5x multiplier during Flash Events |

---

### 🟡 Legendary

| Relic | Icon | Effect |
|---|---|---|
| Prismatic Shard | Gem | +0.5x multiplier when no Flash Event is active |
| Kinetic Capacitor | BatteryCharging | Every 30 wins, next win gains x2 multiplier |
| Logic Gate | CircuitBoard | Every 20 wins, next win guarantees Legendary bonus |

---

### 🔴 Mythical

| Relic | Icon | Effect |
|---|---|---|
| Soul of the Machine | Fingerprint | 5% chance for 3x reward multiplier |
| Temporal Anchor | Anchor | Flash Events last +1 round |
| The Architect's Keystone | Diamond | Upgrades triggered bonuses to next rarity |

---

## 🔥 Mythical Bonus Tier

A special x15 tier unlocked primarily through The Architect's Keystone.

Visual traits:
- Crimson bloom
- Instability flicker
- Red particle eruptions
- Heavy motion trails

---

## 💥 Multiplier Slam System

A post-result escalation layer that triggers only on high-tier relic procs. It interrupts the normal result flow and replays the final payout as a staged impact sequence rather than an instant update.

---

### x2 Slam
- Large orange “x2” drops in with a weighted fall animation
- Brief impact freeze frame locks the result state
- Subtle screen shake on landing to emphasize force
- Multiplier stays visible throughout the payout climb
- Value then ticks upward into the final boosted total

---

### x3 Slam
- Enhanced red-tier version of the same system
- Heavier drop inertia with stronger visual recoil on impact
- Longer freeze window before payout begins
- Deeper glow stack with expanded bloom and saturation spike
- Extended ticker duration for more dramatic payout reveal
- Feels heavier, slower, and more unstable than x2

---

### Sequence
1. Base result resolves and locks in a pre-slam state  
2. Freeze frame triggers on impact timing window  
3. Multiplier slam enters with animated drop and impact feedback  
4. Payout value ticks upward until final total is reached

---

## 🔊 Audio System

| Layer | Purpose |
|---|---|
| Metallic slam | Impact cue |
| Coin cascade | Payout acceleration |
| Shimmer ring | Resolution finish |

---

## 🎁 Relic Drop Presentation

When a relic drops:

- “🧿 RELIC FOUND” popup appears
- Rarity-matched animated background plays behind the popup
- Relic is automatically added to inventory on drop
- Player can choose Equip or Dismiss
- Equipping sets the relic as active without removing it from inventory
- Dismiss closes the popup and the relic remains in inventory for later use

---

## 🧠 Design Philosophy

At high point scales, raw numbers lose meaning. The relic system restores engagement through:

- Build identity
- Long-term progression
- Controlled randomness
- High-impact visual moments
- Strategic specialization across rarity tiers

It transforms RPS League into a live progression system with evolving meta builds and escalating spectacle.