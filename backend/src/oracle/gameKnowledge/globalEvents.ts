export const globalEvents = `
SYSTEM DEFINITIONS: GLOBAL EVENTS
Global Events are server-wide, real-time synchronized event loops broadcasted to all active players simultaneously via Server-Sent Events (SSE). 

LIFECYCLE PHASES:
1. Event Cooldown: 10 to 12 minutes of inactive time before the next event selection.
2. Warning Phase: 30 seconds of visual warnings, Oracle text alerts, and speech countdown announcements.
3. Active Phase: 60 seconds of high-intensity gameplay modifiers, custom shaders, and marquee feeds.
4. Quiet Period: 60 seconds of separation after the Active Phase before the next Event Cooldown begins.

CONCURRENT ACTIVATION RULE:
Only one Global Event can be active at any time. Two Global Events cannot run simultaneously and do not stack. The system enforces a strict sequential loop: one event completes its Active Phase, a 60-second quiet period follows, and only then does the next cooldown begin. There is no queuing of pending events.

WORLD BOSS COORDINATION:
Global Events cannot activate while a World Boss encounter is active. If an event launch is attempted while a World Boss is blocking the system, the launch is deferred and retried after 5 seconds until the World Boss is no longer blocking.

BONUS STAGE COORDINATION:
Global Events cannot activate while a Bonus Stage session is active. If an event launch is attempted while an active Bonus Stage session exists, the launch is deferred and retried after 5 seconds until no Bonus Stage sessions remain active.

RANDOM WEIGHTED SELECTION:
- Tidal Surge: 30 weight.
- Cyclone Blitz: 25 weight.
- Solar Flare: 20 weight.
- Mirage Cataclysm: 20 weight.

EVENT DETAILS:
1. Tidal Surge: Oceanic theme. Activates "Win Echo Protocol" giving successful predictions a 20% bonus to their calculated win payout. Rich teal and emerald gradients.
2. Cyclone Blitz: Kinetic storm theme. Activates "Streak Turbocurrent" making successful predictions increase win streaks by +2 instead of +1, speeding up streak multipliers. Slate-blue styling.
3. Solar Flare: Thermal plasma theme. Applies a flat 2.0x payout multiplier on all successful predictions. Star-white and deep lavender corona lines.
4. Mirage Cataclysm: Illusion desert theme. Activates "Variable Echo Field" giving successful predictions a random extra payout equal to 15% to 50% of their calculated winnings. Gold-sand dust storms.
TIERS INTRODUCED BY GLOBAL EVENTS:
- Tidal Surge:
  * Novemvigintillion (10^90): Abyssal Trench. Midnight-blue text, neon cyan outlines, sapphire glow.
  * Trigintillion (10^93): Leviathan Maelstrom. Teal/emerald gradients, cyan currents, tsunami clip-path wave foam.
- Cyclone Blitz:
  * Untrigintillion (10^96): Gale-Force Aero. Platinum-silver chrome, trailing wind plumes, jetstream lines.
  * Duotrigintillion (10^99): Razor Tempest. Slate/emerald text, serrated mechanical tracks, vertical sparks.
- Solar Flare:
  * Trestrigintillion (10^102): Solar Prominence. Golden plasma text, volumetric light cone, five-peak solar crown.
  * Quattuortrigintillion (10^105): Zenith Supernova. Star-white/lavender gradient, rotating lens flares, expanding plasma sparks.
- Mirage Cataclysm:
  * Quintrigintillion (10^108): Dune Illusion. Gold sand gradient, heat mirage shadow, rising dust particles.
  * Sextrigintillion (10^111): Phantasm Core. Smoked amethyst text, royal crown outline, purple shimmer, concentric shockwaves.
`