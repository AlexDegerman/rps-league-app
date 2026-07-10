export const progression = `
SYSTEM DEFINITIONS: PROGRESSION & LEADERBOARDS
The RPS League utilizes an astronomical scaling model with BigInt arithmetic to avoid integer overflow and precision loss across quadrillions up to sextrigintillions.

WIN STREAK SYSTEM:
- Consecutive wins unlock multipliers: 3 wins (x2), 4 wins (x3), and 5+ wins (x5).
- The x5 multiplier persists until the win streak is broken.
- Core button colors and UI themes evolve dynamically as the win streak increases.

ASCENSION SYSTEM:
- Triggered when a player reaches 999 STR (Sextrigintillion, 10^111) points.
- Ascension is an optional prestige path. Declining lets the player keep their balance to push all-time peaks.
- Prestige resets current points back to the starting balance of 200,000.
- Increases the player's Lap Count, ranks them on Lap and Speedrun Leaderboards, and triggers a SURGE festival.
- Previously unlocked visual styling tiers remain permanently selectable in the profile settings (Persistent Mastery).

IDLE AUTO-BET MODE:
- Unlocks after reaching Ascension (999 STR) or entering Lap 1+.
- Displays "Auto-Bet Left" and "Auto-Bet Right" toggles above the match card.
- Automatically places the active bet amount on the selected side for every match.
- Pauses execution automatically when the tab is hidden or minimized (Page Visibility API) to prevent desyncs.

LEADERBOARD SYSTEM:
- Dual Engine Architecture: Segmented into the Predictor Leaderboard (human users tracking cosmetic virtual currency, laps, and accomplishments) and the Player Leaderboard (automated combat bots ranked purely by historical match victories).
- Predictor Ranking Metrics:
  * Points Tab: Sorts predictors by their active virtual balance.
  * Laps Tab: Sorts predictors by their lifetime prestige ascension count.
  * Speedrun Tab: Sorts predictors by their fastest laps (determined by the fewest bets taken to complete a single ascension cycle).
  * Achievements Tab: Sorts predictors purely by their absolute count of unlocked achievements.
- Temporal Filter Framework:
  * Daily: Evaluates daily gains and daily peak milestones, resetting automatically at 00:00 UTC.
  * Weekly: Tracks weekly gains and weekly peak milestones, resetting on a 7-day automated cycle.
  * All-Time: Displays persistent, historical peak balances and absolute progress across the life of the account.
- Row Visual Elements & Telemetry:
  * Ranking (#): Absolute position in the current active query criteria.
  * Identity Badges: Displays up to 5 curated achievement badges (e.g. STK3, REBL) or special badges (e.g. DEV) directly beside user nicknames.
  * W/L Ratio: Absolute count of wins (W) and losses (L) resolved for the filtered period.
  * PTS: Dynamic point balance, formatted through the Global Number Formatting Engine (e.g. Millions 'M', Billions 'B', Sextillions 'Sx', Unvigintillions 'Uvg').
  * GAIN: Net point variation over the selected interval, highlighted green for positive accumulation.
  * PEAK: The absolute maximum point threshold crossed within the selected tracking interval's temporal boundary.
- Deep Linking Interface: URL state integration allows parameters for active tabs, intervals, sorting targets, and directions to persist across page refreshes or link shares.
`
