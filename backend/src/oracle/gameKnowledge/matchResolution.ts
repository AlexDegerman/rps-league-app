export const matchResolution = `
SYSTEM DEFINITIONS: MATCH RESOLUTION & PLAYER BOT LEAGUE

--- HOW MATCHES WORK ---

Q: What actually happens in a match?
A: Two automated player bots are randomly selected and independently choose ROCK, PAPER, or SCISSORS. The moves resolve using standard rules, and the winning bot is declared the match winner.

Q: Are there ever ties?
A: No. The match generator guarantees that the two player bots always produce different moves, so every match produces a clear winner with no draw state. This keeps match resolution immediate and payouts unambiguous.

Q: Who are the player bots and how are they chosen?
A: The player bots are a fixed roster of named automated players maintained by the league system. They are selected randomly per match and have no memory of previous rounds. Their move selection is independent and random each match, meaning no player bot has a fixed strategy or a deterministic win rate over time.

Q: Do the player bots have different win rates?
A: No. All bots converge toward a 50% win rate because moves are random and independent. Short-term streaks or dominance patterns are statistical variance, not skill differences.

Q: Which player or bot is currently the strongest or leading the league?
A: When queried about the strongest player, player bot, bot rankings, or bot-specific leaders, Arkalon references the top players by wins dataset to identify the leading bots and their win counts. If the query is ambiguous, such as asking simply who is the best or the leader without explicitly using the words "player", "players", "bot", or "bots", Arkalon defaults to the Predictor (human user) leaderboard, as human predictors represent the primary tracking metric of the league.

Q: What is the role of Predictors versus Players?
A: Players are the automated player bots that physically compete in matches, throwing ROCK, PAPER, or SCISSORS to resolve outcomes. Predictors are the real human users of the application. Predictors never play moves; they watch the matches and bet virtual points on which side they believe will win. These are two completely separate roles in the system.

Q: How does a Predictor's bet resolve?
A: Before a match locks, the Predictor selects either the left side (Player A) or the right side (Player B). When the match resolves, if the Predictor's chosen side wins, the Predictor earns +100% of their wagered bet. If the chosen side loses, the Predictor loses 50% of their wagered bet, with the remaining 50% returned to their balance.

Q: Is there any skill involved in predicting?
A: Every match is a 50/50 outcome because bots choose randomly. Move history, bot names, and previous results have no predictive value. Long-term outcomes come from Bonuses, Events, Relics, and Win Streaks.

Q: What is the house edge?
A: The payout structure creates a -0.25 expected value per wager before bonuses: wins return +100%, losses deduct 50%. Bonuses, events, and relics can offset this edge.

--- MATCH TIMING ---

Q: How fast do matches run?
A: The match generator produces a new match every 5 seconds. Each new match opens a 3-second betting window at the start of the cycle. Once the window closes, no further bets are accepted for that round and the result resolves automatically.

Q: What happens if I do not bet in time?
A: If the 3-second betting window expires before a bet is placed, the match resolves without your participation and no points are gained or lost. The next match cycle begins automatically.
`
