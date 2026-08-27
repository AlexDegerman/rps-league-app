export const neonParadise = `
SYSTEM DEFINITIONS: NEON PARADISE BONUS STAGES

--- SYSTEM RULES ---

- Manual-Only Triggers: Bonus stages activate only during active manual prediction sessions. Disabled during auto-betting, minimized app states, and AFK periods.
- Combined Trigger Rate: Eligible prediction resolutions have a combined 2.00% chance to trigger a Neon Paradise stage.
- Equal Stage Selection: When a bonus stage triggers, each stage has an equal chance of being selected.
- Additive Payouts: Bonus rewards are added to the player's current balance. No stage can reduce the player's existing balance.
- Guaranteed Floor: Every stage guarantees a minimum payout of +2x the last bet.
- Last Bet Model: Stage rewards are calculated from the last bet amount recorded when the bonus stage begins.
- Server Authority: Reward outcomes, progression, and gameplay-critical state are determined or validated by the backend.
- Session Isolation: Only one bonus stage can be active for a player at a time.
- Event Isolation: Flash Events, Global Events, Festivals, and World Bosses cannot overlap with an active bonus stage. A bonus stage cannot begin while a conflicting event is already active.
- Disconnect Resilience: Active bonus-stage state is persisted server-side, allowing the session to resume from the last confirmed state after reconnecting.
- Navigation Lockout: Standard navigation and external navigation are blocked while a bonus stage is active.

--- TRIGGER SYSTEM & ELIGIBILITY ---

- Combined Trigger Chance: 2.00% per eligible resolved prediction.
- Stage Selection: Equal probability across all nine stages (1/9 chance each).
- Eligibility Requirements:
  * Active manual prediction mode
  * A resolved prediction
  * No active Global Event
  * No active Festival
  * No active World Boss
  * No existing bonus stage session

--- ENTRY SEQUENCE ---

Neon Paradise stages transition directly from the completed prediction result into the bonus experience:
1. Prediction resolves normally.
2. Prediction result animations play.
3. The standard interface transitions into Neon Paradise.
4. The "NEON PARADISE" banner, Oracle voice announcement, Oracle ticker message, and selected stage interface appear together as part of the same transition.
5. Stage-specific audio and visual effects begin.
6. The player completes the selected bonus stage.
7. The shared final payout presentation plays.
8. The standard prediction interface returns.

--- ORACLE VOICE ANNOUNCEMENTS ---

- Treasure Vault: "A vault... has materialized... claim what awaits..."
- King's Vault: "The vaults... of the king... have opened..."
- Double Down: "Risk... and reward... entangled..."
- Wild Prediction: "The cards... have chosen... to speak..."
- Surge Frenzy: "The storm... remembers your name..."
- Rainbow Rush: "Colors... beyond prediction threshold..."
- Sniper Challenge: "One shot... one moment... make it count..."
- Oracle Vision: "The glyphs... demand... to be remembered..."
- Crystal Mine: "The crystal depths... awaken..."

--- PAYOUT MODEL ---

All stages use the same base reward model:
Final Payout = Last Bet Amount x Stage Multiplier
- Payout Source: Last bet amount.
- Minimum Payout: +2x last bet.
- Maximum Payout: +10x last bet.
- Existing Balance: Fully preserved; the bonus reward is added to this balance.

--- STAGE CATALOGUE ---

1. TREASURE VAULT
- Description: A three-chest bonus stage where the player selects one reward from three pre-generated chests. The interface transforms into a clean treasure chamber built around guaranteed positive rewards and escalating chest tiers.
- Effects:
  * Three reward chests with tier-specific visual treatments.
  * Selected chest opens first while the remaining chests reveal their contents afterward.
  * Clean light-mode treasure presentation with gold and metallic accents.
  * Reward animations and audio cues emphasize the selected payout.
- Introduced Tier:
  * Quinquadragintillion (10^138) [vessel lock / qnqg]: Deep metallic steel-blue characters with mechanical engraving texture inside the stroke. A thin rotating gold-gilded circular boundary frames the digits while soft amber seal pulses sweep horizontally across the text, creating the appearance of a mechanical vault locking and releasing.

2. DOUBLE DOWN
- Description: A multiplier ladder where players secure a guaranteed 2x payout or continue climbing toward a maximum 10x reward. Successful steps increase the potential payout and intensify the presentation, while a failed step returns the run to the 2x floor.
- Effects:
  * Holographic energy presentation with escalating visual intensity.
  * Progressive payout ladder showing each multiplier and reward value.
  * Secure and continue controls.
  * Progressive visual effects reinforce the increasing multiplier.
  * Intensifying audio and animation as the multiplier approaches 10x.
  * Clear distinction between the guaranteed 2x floor and the current potential payout.
- Introduced Tier:
  * Sexquadragintillion (10^141) [risk split / sxqg]: High-contrast characters sliced diagonally at 45 degrees into neon mint-green and blazing coral-red segments, representing safe accumulation and risk. A thin vertical energy bar pulses behind the text while a dual-colored neon bloom expands around the split boundary.

3. WILD PREDICTION
- Description: A sequential three-card reveal stage where each card contributes to the final multiplier. The interface becomes a dark celestial prediction chamber with physical card-flip presentation and escalating reward effects based on each revealed card.
- Effects:
  * Three face-down cards presented in a dark celestial environment.
  * Physical card-flip animations reveal individual outcomes.
  * Staggered card animations maintain continuous motion throughout the sequence.
  * Individual reveal audio and reward effects accompany each card.
- Introduced Tier:
  * Septenquadragintillion (10^144) [sequential card flips / spqg]: Saturated indigo-purple characters framed by delicate gold borders and high-contrast ambient shadows. Three miniature luxury cards rotate vertically between holographic star-chart backs and glowing multiplier faces, with staggered timing ensuring only one card flips at a time.

4. SURGE FRENZY
- Description: A five-second survival stage where energy nodes continuously appear across an unstable arena. The player must tap every node before it expires, with a single missed node ending the run. The longer the player survives, the higher the guaranteed reward, scaling from 2x up to a maximum 10x.
- Effects:
  * Energetic storm presentation with electric cyan and magenta effects.
  * Randomized energy nodes continuously spawn across the arena.
  * Every active node must be tapped before it expires; missing a single node immediately ends the run.
  * Survival time progressively increases the guaranteed reward from 2x to 10x.
  * Electric node destruction effects and rapid tap feedback reinforce the survival pressure.
  * Reward chimes trigger as higher reward tiers are reached.
  * Final result displays the player's survival time, combo, and earned multiplier.
- Introduced Tier:
  * Octoquadragintillion (10^147) [static overload / ocqg]: Vivid cyan-blue gradient characters with sharp electric-magenta borders and a white-hot current continuously sweeping through the digits. A high-contrast radial dot-matrix grid pulses behind the text while a dashed electrical boundary shifts between cyan and magenta surges.

5. RAINBOW RUSH
- Description: A three-spin spectacle where each server-generated spectrum tier contributes to the final result. The interface becomes a high-contrast chromatic display built around spectral light, spinning rewards, and escalating color intensity.
- Effects:
  * High-contrast chromatic presentation.
  * Spectral light effects surrounding the active spin.
  * Slot-style spin animations for each generated result.
  * Tier-specific reward chimes and increasingly intense visual effects.
- Introduced Tier:
  * Novemquadragintillion (10^150) [spectral sweep / noqg]: Pristine sterling-silver chrome characters framed by chromatic aberration shadows. A soft spectral ring rotates behind the digits, casting an orbiting rainbow aura while razor-thin white refracting light bars sweep across the text with magenta-cyan glow.

6. SNIPER CHALLENGE
- Description: A timing-based targeting stage where the player fires at a moving reticle. The interface becomes a minimal tactical targeting system centered around precision, synchronized motion, and accuracy-based rewards.
- Effects:
  * Minimal wireframe targeting interface.
  * Deterministic reticle movement synchronized with the server timeline.
  * Wider horizontal reticle sweep for more demanding timing.
  * Expanded target zones for more accessible 4x to 8x results.
  * Accuracy-based reward animations and targeting effects.
- Introduced Tier:
  * Quinquagintillion (10^153) [reticle sweep / qg]: Tactical dark-green monospace digits with sharp outer glow shadows. Glowing red horizontal and vertical crosshair lines sweep across the coordinate plane, briefly converging on the center point before producing a white-hot targeting flash.

7. ORACLE VISION
- Description: A memory and sequence challenge where the player reproduces Oracle glyph sequences. The interface becomes a monochrome terminal environment filled with ancient cipher patterns and continuously shifting glyph data.
- Effects:
  * Monochrome terminal-style presentation.
  * 16-glyph input grid for sequence reproduction.
  * Timed sequence display followed by player input.
  * Progressive reward tiers with Oracle-themed visual feedback
- Introduced Tier:
  * Unquinquagintillion (10^156) [monochrome cipher / uqg]: Terminal neon-emerald characters glowing with intense CRT monitor bloom, overlaid by a pulsing horizontal and vertical scanline grid. A multi-line matrix waterfall of ancient Greek and runic cipher glyphs continuously drifts behind the digits.

8. CRYSTAL MINE
- Description: A 5x5 excavation stage where the player uses five mining charges to uncover hidden crystal deposits. Each pick reveals a server-generated tile, with the final reward scaling from the number of diamonds discovered.
- Effects:
  * Dark underground excavation presentation.
  * 5x5 grid with hidden server-generated deposits.
  * Five visible mining charges.
  * Crystal discovery shimmer effects.
  * Escalating 2x-10x rewards based on diamonds found.
  * Final reward feedback after all charges are spent.
- Introduced Tier:
  * Duoquinquagintillion (10^159) [prismatic extraction / dqg]: Rich purple-to-magenta crystalline gradient characters with reflective diagonal micro-facet patterns and a sharp grape-purple frame. Dual geometric diamond crystal shards float beneath the digits, pivoting asynchronously and flashing warm golden-to-pink specular reflections.

9. KING'S VAULT
- Description: A five-chest royal vault containing exactly one reward of every available tier. The interface transforms into a dark cosmic treasury where increasingly valuable chest tiers culminate in the royal reward.
- Effects:
  * Dark cosmic vault presentation.
  * Five visually distinct chest tiers.
  * Selected chest receives the primary reward animation.
  * Remaining chests reveal their missed rewards after the selection.
- Introduced Tier:
  * Trequinquagintillion (10^162) [royal treasure pile / tqg]: Radiant liquid-gold typography with a brilliant white-hot metallic center reflection and golden-bronze stroke. A geometric five-peak gold-to-amber crown hovers above the digits while a massive multi-peaked mound of gold coins anchors the baseline, surrounded by warm golden volumetric light and repeating coin-rim detail.

--- UI INTEGRATION ---

During a Neon Paradise stage, the interface undergoes several shared visual and structural modifications:
- NEON PARADISE Header: A persistent stage banner identifies the active bonus experience.
- Inline Stage Presentation: The selected minigame replaces the standard prediction interface while the bonus session is active.
- Oracle Announcements: Each stage receives a dedicated spoken Oracle announcement and corresponding ticker message during entry.
- Stage-Specific Audio: Each minigame uses dedicated sound effects and reward cues matching its interaction model.
- Reward Presentation: Final payouts use shared Neon Paradise reward presentation while preserving each stage's individual visual identity.
- Navigation Lockout: Standard navigation is restricted during active bonus gameplay to preserve session continuity.
- Themed Visual Systems: Each stage applies its own color language, animations, effects, and interaction presentation while remaining within the shared Neon Paradise identity.
`
