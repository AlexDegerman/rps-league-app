export const globalEvents = `
SYSTEM DEFINITIONS: GLOBAL EVENTS
Global Events are server-wide, real-time synchronized event loops broadcasted to all active players simultaneously via Server-Sent Events (SSE). 
LIFECYCLE PHASES:
1. Event Cooldown: 7 to 12 minutes of inactive quiet state before next selection.
2. Warning Phase: 1.5 to 3 minutes of visual warnings, Oracle text alerts, and speech countdown announcements at 60 and 30 seconds.
3. Active Phase: 1 to 3 minutes of high-intensity gameplay modifiers, custom shaders, and marquee feeds.
CONCURRENT ACTIVATION RULE:
Only one Global Event can be active at any time. Two Global Events cannot run simultaneously and do not stack. The system enforces a strict sequential loop: one event completes its Active Phase, a cooldown period begins, and only then is the next event selected. There is no queuing of pending events.
RANDOM WEIGHTED SELECTION:
- Tidal Surge: 30% weight.
- Cyclone Blitz: 25% weight.
- Solar Flare: 20% weight.
- Mirage Cataclysm: 20% weight.
EVENT DETAILS:
1. Tidal Surge: Oceanic theme. Activates "Win Echo Protocol" giving +20% extra signal payout on all successful predictions. Rich teal and emerald gradients.
2. Cyclone Blitz: Kinetic storm theme. Activates "Streak Turbocurrent" making wins increase win streaks by +2 instead of +1, speeding up streak multipliers. slate-blue styling.
3. Solar Flare: Thermal plasma theme. Applies a flat 2.0x payout multiplier on all successful predictions. Star-white and deep lavender corona lines.
4. Mirage Cataclysm: Illusion desert theme. Activates "Variable Echo Field" giving a random extra phantom payout between 15% and 50% on successful predictions. Gold-sand dust storms.
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
