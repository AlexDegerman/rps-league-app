# Changelog

All notable changes to the platform will be documented in this file.

## [1.14] - Recovery Code Onboarding

### Added

* **Recovery Code Tutorial:** First-time visits to the Profile page now trigger a guided onboarding experience focused on account recovery. The tutorial automatically navigates players to the Recovery section, dims surrounding content, and explains the importance of securely saving recovery credentials before leaving the page.
* **Cross-Device Tutorial Persistence:** Tutorial completion is now stored server-side and synchronized at the account level. Once completed, the onboarding flow will never reappear, regardless of browser, platform, or device.
* **Dynamic Spotlight System:** Introduction of a precision spotlight architecture that performs live DOM measurements to accurately frame the Recovery section. Positioning is continuously recalculated during automated scrolling to maintain visual alignment throughout the tutorial sequence.
* **Scroll State Restoration:** The onboarding system now preserves the player's original page position before navigation. Upon dismissal, the interface seamlessly returns to the exact location the player was viewing prior to the tutorial.


## [1.13] - The Relic Protocol

### Added
- **The Reliquary System:** A permanent equipment layer for account-wide progression modifiers. Predictors collect and socket artifacts across Rare, Legendary, and Mythical tiers to fundamentally alter gameplay and event outcomes.
- **Anti-Swap Architecture:** Integration of "Socket Commitment" logic to ensure strategic integrity. "Trigger Snapshots" lock event bonuses at the moment of activation, while "Socket-Locked Progress" ensures charge-based counters only advance while the specific Relic is active.
- **Blueprint UI & Drawer:** A high-fidelity, slide-up panel for rapid Relic management. This interface utilizes a technical "schematic" design language, optimized for mobile-first navigation and seamless swapping between matches.
- **"Multiplier Slam" VFX:** High-impact animations for specific Relic-influenced multiplier payouts. When an equipped item provides an additional multiplier, the result screen triggers a physics-based "Slam" effect with rarity-specific particle bursts.
- **Socket Header Integration:** A persistent "Socket" display in the primary game header. This visual indicator features rarity-specific border glows and bloom effects, providing a global view of the active Relic and its current status.
- **Chrono-Lap Drop Scaling:** A permanent synergy between Relic discovery and Ascension. Every completed **Chrono-Lap** provides a stacking increase to the base drop rates of all Relic Blueprints, rewarding long-term specialization.
- **Live Progress Telemetry:** Real-time UI feedback for charge-based Relics. Items like the *Logic Gate* or *Kinetic Capacitor* display persistent progress bars directly on their icons to show exact proximity to the next trigger.
- **Discovery Protocol:** A "Discovery equals Ownership" rule for all Relic drops. Once a Blueprint is found, it is added to a permanent account library with no expiration, allowing for the build-out of a complete strategic collection.

## [1.12] - The Achievement Update

### Added
- **Global Achievement Codex:** A massive expansion featuring over 70 unique achievements categorized into 12 distinct tracks, including Combat, Momentum, Dimensional Scale, and dedicated tracks for every Flash Event theme.
- **Dynamic Badge Progression:** Badges now feature a tiered hierarchy from Common to Mythical. Earning a higher-tier achievement automatically upgrades your previous badge, ensuring your profile always showcases your peak performance.
- **Showcase Selection:** Users can now select up to 5 earned badges to display on their public identity. This selection is mirrored on the global leaderboard, allowing players to curate their most prestigious accomplishments.
- **Live Progress Telemetry:** All unearned achievements now feature a "Goal Progress" tracker. Countable objectives (such as total wins or festival participation) display real-time numerical progress bars, while milestones provide clear binary requirements.
- **Horizontal Category Navigation:** The achievement interface has been redesigned with a mobile-first horizontal scroll ribbon. This allows for rapid jumping between progression tracks like "Multiplier Madness" or "The Reliquary" without vertical fatigue.
- **Achievements Leaderboard:** A new global ranking system that tracks the total collection size of every predictor. Collection counts are cached for instant standings updates, allowing you to see where you rank among the world's top collectors.
- **Rarity Visual System:** Achievement cards and badges are now styled by rarity. Mythical achievements feature distinct red auras and animations, while the ultra-rare Rainbow rarity provides a unique "Oil Slick" visual effect reserved for seasonal peaks.
- **Social Badge Integration:** The LinkedIn profile badge has been integrated into the identity system, allowing it to be toggled on as a dedicated social slot that counts toward your total badge display limit.

## [1.11] - The Festival Update

### Added

- **Player Festival system:** Added eight globally-triggered gameplay festivals activated through emergent player behavior including win streaks, loss streaks, high multipliers, Flash Event chains, and Chrono-Lap completions. Only one festival can remain active at a time with a global 5-minute cooldown between activations.
- **Global gameplay modifiers:** Each festival applies a unique live modifier affecting all active players. Effects include payout echoes, streak protection, forced bonus floors, relic amplification, global multipliers, and loss correction systems.
- **Festival interface theming:** Active festivals dynamically transform the full interface using silk-patterned backgrounds, ember particles, themed overlays, countdown timers, persistent effect tickers, and animated result badges.
- **Autonomous Oracle Festival engine:** Added Oracle-triggered weighted festival activations occurring every 18 to 24 minutes when no recent player festival or cooldown is active. Trigger frequency is weighted by economy impact to preserve progression stability.
- **Ghost Echo payout animation:** During Ghost Festival, payouts generate a secondary spectral value animation drifting upward from the final result total, representing the 20 percent signal echo bonus.
- **Spark streak synchronization bonus:** Completing two consecutive Flash Events now activates Spark Festival, granting guaranteed bonus rolls on the player's next three predictions.
- **Global ticker broadcast system:** All festival activations broadcast styled real-time messages to connected players. Player-triggered events display the initiating username while Oracle activations generate procedural instability warnings and system alerts.

## [1.10] - The Idle Update

### Added

- **Idle Auto-Bet system:** After reaching the Ascension threshold or starting Lap 1, two toggle checkboxes unlock above every live match card. Enabling Auto-Bet Left or Auto-Bet Right automatically places your current stake on every incoming match until manually disabled or switched.
- **Server-authoritative unlock validation:** Auto-bet eligibility is validated from the database on session load, not from localStorage, preventing client-side spoofing or early unlocking.
- **Race condition protection:** Added processing lock and 400ms execution buffer to prevent duplicate submissions and overlapping bets on identical match IDs during rapid SSE updates.
- **Page visibility handling:** Auto-betting pauses instantly when the tab becomes hidden or backgrounded and resumes cleanly when the user returns, with no queued or duplicated actions.
- **Contextual onboarding system:** Unlock notification appears automatically after Ascension modal completion and remains active until user interaction or dismissal. During this state, both auto-bet toggles pulse with Oracle glow highlighting.

## [1.9] - The Ascension Update

### Added

- **Launched endgame progression logic:** Introduced "Ascension" milestones where users reaching 999 Octovigintillion choose between a **Chrono Lap** (system reset for prestige) or the **Infinite Path** (continued accumulation).
- **Built efficiency analytics:** Added "Fastest Lap" tracking to measure user performance and transaction speed per reset cycle.
- **Deployed competitive brackets:** Added dedicated leaderboards for Total Laps and Speedrun efficiency to rank the most consistent predictors.
- **Developed a dynamic decision portal:** Built a high-fidelity interface for prestige milestones featuring celestial backgrounds and particle systems.
- **Refined history components:** Redesigned data cards with centered layouts and high-contrast containers for better readability during rapid play.
- **Integrated visual persistence:** Added a styling layer that preserves unlocked tier aesthetics across system resets.

## [1.8] - Daily Oracle Prophecy & Customization

### Added

- **Launched automated AI predictions:** Integrated a daily "Oracle" service providing one high-confidence prediction every 24 hours (resetting at 00:00 UTC).
- **Integrated server-side verification:** Added database tracking for Oracle usage to strictly enforce daily limits across all sessions.
- **Enabled visual tier selection:** Allowed users to manually pin preferred interface themes from 32 unlocked tiers.
- **Deployed adaptive UI scaling:** Introduced an "Auto-Style" toggle that updates the interface aesthetic as players reach new all-time peak thresholds.
- **Locked persistent peak tracking:** Established an authoritative source for cosmetic unlocks, ensuring progress remains independent of daily or weekly cycles.

## [1.7] - Platform Stability & Feedback

### Added

- **Deployed real-time monitoring:** Integrated crash tracking to protect win streaks from being interrupted by technical failures.
- **Built an integrated feedback portal:** Developed a reporting tool that automatically bundles anonymized game state data for faster bug resolution.
- **Improved match stream reliability:** Enhanced health monitoring for live feeds to reduce latency and downtime during peak traffic.
- **Integrated a security validation layer:** Added a gate for the feedback pipeline to maintain leaderboard integrity and prevent spam.

## [1.6] - Event System: Hellfire

### Added

- **Launched a high-intensity environment:** Introduced the "Hellfire" event state, featuring environment-wide crimson shaders and persistent heat shimmer while active.
- **Enabled high-yield multipliers:** Activated a global 5x win multiplier for the duration of the event to accelerate progression.
- **Deployed event-specific particle systems:** Replaced standard win effects with rising flame columns and flying embers for the duration of the state.
- **Integrated themed audio feedback:** Added unique audio triggers to reinforce high-pressure prediction outcomes during the event.
- **Added extended visual tiers:** Launched "Octovigintillion" (Lava) and "Septenvigintillion" (Molten) themes.

## [1.5] - Event System: Luck in the Card

### Added

- **Launched premium themes:** Introduced a gold and amber "High-Roller" event state for top-tier predictors.
- **Enabled guaranteed rewards:** Fixed a 10x "Legendary" reward bonus for every successful match during the event window.
- **Integrated event-specific particle systems:** Replaced standard win effects with cascading card suits and gold particle bursts while the state is active.
- **Added extended visual tiers:** Launched "Sexvigintillion" (Jackpot) and "Quinvigintillion" (Holographic) themes.

## [1.4] - Event System: Electric Surge

### Added

- **Deployed a volatile environment:** Launched "Electric Surge," featuring neon-violet interface shifts and electric purple highlights for the event duration.
- **Enabled momentum scaling:** Activated a 5x win multiplier to reward active participation during the event window.
- **Enabled event-specific particle systems:** Swapped standard win effects for high-speed electric static rain and lightning audio cues while the event is active.
- **Added extended visual tiers:** Introduced "Quattuorvigintillion" (Supercell) and "Trevigintillion" (Charged) themes.

## [1.3] - Event System: Moon's Blessing

### Added

- **Built randomized event logic:** Created a system to trigger 3-match event windows with a 5% random occurrence rate per transaction.
- **Launched a serene aesthetic:** Introduced "Moon's Blessing," a temporary low-light theme featuring cool blue tones and lunar surface textures.
- **Added event-specific particle systems:** Replaced standard win effects with moonlight-inspired gradients and navy-to-white sweeps during the event window.
- **Added extended visual tiers:** Launched "Duovigintillion" (Eclipse) and "Unvigintillion" (Moonlit) themes.

## [1.2] - Win Streak Multipliers

### Added

- **Launched tiered multipliers:** Introduced "Fever Time," applying escalating multipliers (3x, 6x, and 10x) for consecutive wins.
- **Enabled streak retention:** Updated logic so the 10x ceiling remains active until a prediction failure occurs.
- **Integrated real-time color mapping:** Programmed the interface to shift dynamically from green to red as win streaks increase.
- **Added historical metrics:** Integrated "Longest Win Streak" as a permanent metric in player metadata.

## [1.1] - Social Profiles & Identity

### Added

- **Launched public profiles:** Created unique, shareable URLs for users to showcase historical performance and statistics.
- **Enabled peer inspection:** Added the ability to view detailed trends and data for any user on the global leaderboard.
- **Integrated verified identities:** Added LinkedIn profile linking for verified player badges.
- **Expanded the identity service:** Updated the name generator to increase variety in the anonymous user pool.

## [1.0] - Platform Launch

### Added

- **Launched the Oracle:** Integrated an AI-powered analysis engine providing real-time move heat maps and player dominance tracking.
- **Built low-barrier onboarding:** Created an instant-start system with 200,000 credits and no mandatory registration.
- **Deployed a live match engine:** Built a service processing 17,000+ matches daily via low-latency streams.
- **Integrated support for Vigintillion-scale scores:** Custom-built a numeric system to support values scaling into the Vigintillions.
- **Launched global indexing:** Deployed a multi-tab leaderboard for Daily, Weekly, and All-Time competitive data.
