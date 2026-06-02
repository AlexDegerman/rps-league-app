# Changelog

All notable changes to the platform will be documented in this file.

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
