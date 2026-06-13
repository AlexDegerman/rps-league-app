export type Update = {
  version: string
  label: string
  notes: string[]
}

export const UPDATES: Update[] = [
  {
    version: '1.15',
    label: 'The Oracle Voice Update',
    notes: [
      'Oracle TTS: The Daily Oracle Prophecy now speaks aloud when it appears. Implemented via browser-native Web Speech API with no external dependencies or server cost.',
      'Mythical Cadence Engine: Speech text is transformed before delivery, adding rhythmic micro-pauses between words and at punctuation boundaries for a deliberate, weighted delivery at pitch 0.25.',
      'Festival Voice: All eight festival types now include a dedicated spoken line broadcast in the same SSE payload as the display message. Each line is short-form and optimized for low-pitch TTS delivery.',
      'Audio Controls Popover: The mute button has been replaced by an audio controls interface with independent toggles and volume sliders for Sound FX and Oracle Voice. Both settings persist to localStorage.',
      'Voice Priming: Oracle voices are loaded at app mount and re-fetched at speak time to prevent Chrome async loading from causing silence on first trigger.',
      'Oracle Voice on by default: New and returning users have Oracle Voice enabled automatically. It can be toggled off from the audio controls popover at any time.'
    ]
  },

  {
    version: '1.14',
    label: 'The Onboarding Update',
    notes: [
      'Recovery Code Tutorial: First profile visit now surfaces a focused overlay that auto-scrolls to the recovery section, dims the page, and explains the importance of saving the recovery code before navigating away.',
      'Server-Side Persistence: Tutorial completion is stored in the database and follows the player across devices. The tutorial never repeats regardless of browser or device.',
      'Spotlight Architecture: The onboarding overlay uses live DOM measurement to position a cutout spotlight accurately over the recovery section, including re-measurement during the auto-scroll animation.',
      'Scroll Restoration: The page scroll position is saved before the auto-scroll and restored after dismissal so the player returns to where they were.'
    ]
  },
  {
    version: '1.13',
    label: 'The Relic Protocol',
    notes: [
      'The Reliquary: A permanent account-wide progression system featuring unique Relics across Common, Rare, Legendary, and Mythical tiers.',
      'Anti-Swap Architecture: Implementation of "Socket Commitment" logic to ensure strategic choices are made before events trigger.',
      'Snapshot Technology: Flash Event bonuses (Multipliers and Duration) lock at the moment of trigger to maintain competitive balance.',
      'Socket-Locked Persistence: Charge-based Relics feature deep-state memory, saving progress across sessions and resuming only when re-equipped.',
      'Blueprint Interface: A mobile-first slide-up drawer designed for seamless Relic swapping with a technical, schematic-inspired aesthetic.',
      'Multiplier Slam VFX: Physics-based payout animations that trigger specifically when high-tier Relics like "Soul of the Machine" activate.',
      'Ascension Drop Scaling: Permanent, stacking discovery rate bonuses for all Relic rarities tied to total Chrono-Laps completed.'
    ]
  },
  {
    version: '1.12',
    label: 'The Achievement Update',
    notes: [
      'Global Achievement Codex: Over 70 unique accomplishments across 12 categories, rewarding everything from massive win streaks to specialized Flash Event mastery.',
      'Badge Showcase: Customize your public identity by choosing your Top 5 badges to display on your profile and the global leaderboard.',
      'Goal Telemetry: Locked achievements now display high-contrast requirements and real-time progress bars showing exactly how close you are to the next unlock.',
      'Tiered Upgrading: Higher rarity badges now automatically replace lower-tier versions in your collection to keep your showcase focused on your greatest hits.',
      'Category Hub: Navigate the vast codex easily with a new horizontal category ribbon designed for fast swiping and filtered viewing on mobile devices.',
      'Achievements Leaderboard: Compete for the title of "Grand Archivist" in a new leaderboard tab that ranks players by their total achievement collection.',
      'Rarity Styling: Experience a completely overhauled visual system where every achievement rarity features unique colors, borders, and animated auras.'
    ]
  },
  {
    version: '1.11',
    label: 'The Festival Update',
    notes: [
      'Player Festivals: Eight globally-triggered gameplay events now activate based on emergent player milestones including win streaks, loss streaks, high multipliers, and Chrono-Lap completions. One festival can be active at a time with a 5-minute cooldown between activations.',
      'Festival Effects: Each festival applies a unique modifier for all active players. Effects range from guaranteed win echoes (Ghost), forced bonus floors (Resonance), streak protection (Fever), a 3x global multiplier (Surge), and forced win correction on 4-loss streaks (Sanguine).',
      'Festival UI System: Active festivals theme the full interface with colored silk backgrounds and ember particles. A countdown ticker, persistent effect scroll bar, and result animation badge communicate the active state throughout the duration.',
      'Autonomous Oracle Festivals: The Oracle system triggers weighted random festivals every 18 to 24 minutes when no player festival has occurred in the last 10 minutes and no cooldown is active. Frequency is weighted by economy impact, with Resonance and Spark firing most often and Surge and Sanguine kept deliberately rare.',
      'Ghost Echo Animation: Ghost Festival wins display a ghostly echo value drifting upward from the result number after it finishes counting, representing the 20% signal echo applied to the final payout.',
      'Spark Streak Bonus: Players who trigger Spark by completing 2 consecutive Flash Events receive a guaranteed bonus roll on their next 3 predictions in addition to the global Flash Event synchronization.',
      "Oracle Ticker Broadcast: All festival activations broadcast a styled message to all connected players. Player-triggered festivals show the initiating player's name. Oracle-triggered demos display procedurally generated system instability messages."
    ]
  },
  {
    version: '1.10',
    label: 'The Idle Update',
    notes: [
      'Idle Auto-Bet: After reaching the Ascension threshold or starting Lap 1, two tick boxes unlock above every live match card. Ticking Auto-Bet Left or Right instructs the system to place your current stake automatically on every incoming match until manually toggled off or switched.',
      'Server-Authoritative Eligibility: The idle unlock state is validated against the database on load, not localStorage. The controls cannot be enabled through browser tooling before the threshold is reached.',
      'Race Condition Guard: A processing lock and 400ms execution buffer prevent duplicate submissions on the same match ID. Rapid SSE events cannot stack overlapping requests.',
      'Page Visibility Lifecycle: Auto-betting halts immediately when the tab is backgrounded or hidden and resumes cleanly on return with no queued backlog.',
      'Contextual Onboarding: The unlock notification surfaces automatically after the Ascension modal resolves and persists until the player either interacts with the tick boxes or manually dismisses it. Both tick boxes pulse with the Oracle glow effect during the active notification window.'
    ]
  },
  {
    version: '1.9',
    label: 'The Ascension Update',
    notes: [
      'Ascension Crossroads: Reaching 999 Octovigintillion unlocks a choice between The Chrono Lap (Reset for Prestige) or the Infinite Path (Raw Accumulation).',
      'Efficiency Metrics: Introduced Laps and "Fastest Lap" tracking. Speedrun performance is now measured by the number of bets taken per reset cycle.',
      'Competitive Brackets: Deployed dedicated leaderboards for Total Laps and Speedrun efficiency to track the league’s most skilled predictors.',
      'Interface Refinement: Developed a decision portal featuring celestial silk backgrounds and dynamic environmental particle effects.',
      'Bet History Overhaul: Redesigned history cards with centered matchups, detached +/- signs, and solid glass containers for improved legibility.',
      'Visual Persistence: Earned point-tier stylings remain permanently accessible in user profiles, ensuring visual progression is preserved across resets.'
    ]
  },
  {
    version: '1.8',
    label: 'Daily Oracle & Visual Customization',
    notes: [
      'Daily Oracle Prophecy: Introduced a server-side AI analyst providing one guaranteed winning prediction per day, resetting at midnight UTC.',
      'Infrastructure Integrity: Prophecy usage is verified server-side via database tracking, ensuring one-time daily usage is enforced regardless of browser state.',
      'Oracle Visualization: High-priority recommendations are now signaled by a distinctive purple pulse animation on the active prediction card.',
      'Visual Tier Selection: Users can now pin their preferred point styling from 32 unlocked tiers, ranging from Millions to Octovigintillion.',
      'Adaptive Styling: Implemented an Auto-Style toggle that dynamically updates your interface aesthetic as new all-time peak thresholds are reached.',
      'Persistent Achievement Tracking: Deployed permanent peak tracking as the authoritative source for cosmetic unlocks, unaffected by daily or weekly cycles.'
    ]
  },
  {
    version: '1.7',
    label: 'Observability and Feedback Portal',
    notes: [
      'Engine Stability: Deployed real-time crash monitoring to ensure win streaks are never interrupted by technical failures.',
      'Feedback Portal: Report bugs or suggestions directly from the game. Reports now automatically include game state for faster resolution.',
      'Session Persistence: Improved connection health monitoring for the live match stream, reducing downtime during high-volume periods.',
      'Instant Alerts: Developer notification systems implemented for critical issues, allowing for rapid hotfixes.',
      'Spam Protection: Implemented a security layer to protect the integrity of the feedback pipeline and leaderboard stats.'
    ]
  },
  {
    version: '1.6',
    label: 'Flash Event: Hellfire',
    notes: [
      'The Season 1 Finale: A high-intensity state that transforms the arena into a heat-drenched crimson landscape.',
      'Effect: Guaranteed wins with a massive 5x win multiplier active for the duration.',
      'Visual Overhaul: Standard effects replaced with rising flame columns, flying embers, and persistent heat shimmer.',
      'Audio Integration: Fire audio feedback reinforces high-pressure prediction outcomes.',
      'Prestige Tiers: Added Octovigintillion (Lava) and Septenvigintillion (Molten) display styles.'
    ]
  },
  {
    version: '1.5',
    label: 'Flash Event: Luck in the Card',
    notes: [
      'High-Roller Theme: A premium event styled in rich gold and amber tones for the league’s most successful players.',
      'Effect: Guaranteed wins plus a guaranteed Legendary Bonus (10x reward) on every match.',
      'Jackpot Visuals: Win confetti replaced with cascading card suits, gold particle bursts, and shimmer trails.',
      'Prestige Tiers: Added Sexvigintillion (Jackpot) with orbiting dice and Quinvigintillion (Holographic) with rainbow gradients.'
    ]
  },
  {
    version: '1.4',
    label: 'Flash Event: Electric Surge',
    notes: [
      'Digital Storm Aesthetic: A volatile energy theme featuring neon violet and electric purple interface shifts.',
      'Effect: Guaranteed wins with a 5x win multiplier active for the duration of the event.',
      'Dynamic Rain: Standard win confetti replaced with high-speed electric static rain and lightning audio feedback.',
      'Prestige Tiers: Added Quattuorvigintillion (Supercell) with fractal lightning and Trevigintillion (Charged) with neon flickers.'
    ]
  },
  {
    version: '1.3',
    label: "Flash Event: Moon's Blessing",
    notes: [
      'Flash Event System: Introduced live modifier system with a 5% trigger chance, active for 3 predictions.',
      'Moon’s Blessing: A serene event that wraps the arena in cool blue tones and moonlight aesthetics.',
      'Celestial Tiers: Added Duovigintillion (Eclipse) with lunar surface textures and Unvigintillion (Moonlit) with navy-to-white sweeps.'
    ]
  },
  {
    version: '1.2',
    label: 'Fever Time: Win Streak Multipliers',
    notes: [
      'Streak Escalation: Chain consecutive wins to activate escalating rewards at 3 wins (3x), 4 wins (6x), and 5 wins (10x).',
      'Ceiling Persistence: The 10x multiplier remains active until the current win streak is broken.',
      'Visual Momentum: The interface color shifts in real-time from calm greens to intense reds as momentum builds.',
      'Persistent Records: Longest Win Streak is now a permanent statistic tracked in global player profiles.'
    ]
  },
  {
    version: '1.1',
    label: 'Social Profiles and Identity',
    notes: [
      'Global Profiles: Every user now has a unique, shareable URL displaying bet history, biggest wins, and performance stats.',
      'Competitive Inspecting: View detailed performance data and historical trends for any player on the leaderboard.',
      'LinkedIn Integration: Option to link professional profiles to display a verified badge next to player identities.',
      'Identity Diversity: Expanded the random identity generator for increased variety in player names.'
    ]
  },
  {
    version: '1.0',
    label: 'League Launch',
    notes: [
      'The Oracle: Introduced an AI-powered competitive analyst for real-time move heat maps and player dominance tracking.',
      'Zero-Friction Identity: Start with 200,000 points instantly with no registration or login required.',
      'High-Frequency Simulation: A live-service engine delivering over 17,000 matches per day via low-latency streams.',
      'Vigintillion Scale: Custom-built architecture supporting scores into the Vigintillions.',
      'Dynamic Economy: Win/Loss multipliers combined with a tiered bonus system (Common to Legendary).',
      'Pity Mechanic: Internal protection guarantees a bonus event trigger at least once every 4 matches.',
      'Global Rankings: Full predictor leaderboard featuring Daily, Weekly, and All-Time competitive tabs.'
    ]
  }
]

export const LATEST_UPDATE = UPDATES[0]
export const CURRENT_VERSION = UPDATES[0].version
