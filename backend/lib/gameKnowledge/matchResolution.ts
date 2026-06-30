export const matchResolution = `
SYSTEM DEFINITIONS: MATCH RESOLUTION & BOT LEAGUE

--- HOW MATCHES WORK ---

Q: What actually happens in a match?
A: Two automated league bots are randomly selected from the bot roster and assigned to play a match against each other. Each bot independently selects one of three moves: ROCK, PAPER, or SCISSORS. The moves are resolved using standard rules: Rock crushes Scissors, Scissors cuts Paper, Paper covers Rock. The bot whose move beats the other is declared the match winner.

Q: Are there ever ties?
A: No. The match generator guarantees that the two bots always produce different moves, so every match produces a clear winner with no draw state. This keeps match resolution immediate and payouts unambiguous.

Q: Who are the bots and how are they chosen?
A: The bots are a fixed roster of named automated players maintained by the league system. They are selected randomly per match and have no memory of previous rounds. Their move selection is independent and random each match, meaning no bot has a fixed strategy or a deterministic win rate over time.

Q: Do the bots have different win rates?
A: Over large sample sizes, all bots converge toward a 50% win rate due to fully random independent move selection. Short-term variance will produce streaks and apparent dominance patterns in any small window of match history, but these are statistical noise rather than skill differentials.

Q: What is the role of Predictors versus Players?
A: Players are the automated bots that physically compete in matches, throwing ROCK, PAPER, or SCISSORS to resolve outcomes. Predictors are the real human users of the application. Predictors never play moves; they watch the matches and bet virtual points on which side they believe will win. These are two completely separate roles in the system.

Q: How does a Predictor's bet resolve?
A: Before a match locks, the Predictor selects either the left side (Player A) or the right side (Player B). When the match resolves, if the Predictor's chosen side wins, the Predictor earns +100% of their wagered bet. If the chosen side loses, the Predictor loses 50% of their wagered bet, with the remaining 50% returned to their balance.

Q: Is there any skill involved in predicting?
A: Because both bots select moves randomly and independently, every match is a 50/50 coin flip at the point of prediction. No move history, bot name, or previous result carries predictive value. The Bonus system, Flash Events, Global Events, Relics, and Win Streaks are the mechanisms that differentiate long-term Predictor outcomes, not prediction accuracy on any individual match.

Q: What is the house edge?
A: The asymmetric payout structure creates a built-in house edge. A correct prediction returns +100% of the wager, while an incorrect prediction costs -50% of the wager. On a 50/50 match, the expected value per unit wagered is -0.25 over the long run before bonuses. The Bonus system, event modifiers, and relic effects can offset or reverse this edge in the short term.

--- MATCH TIMING ---

Q: How fast do matches run?
A: The match generator produces a new match every 5 seconds. Each new match opens a 3-second betting window at the start of the cycle. Once the window closes, no further bets are accepted for that round and the result resolves automatically.

Q: What happens if I do not bet in time?
A: If the 3-second betting window expires before a bet is placed, the match resolves without your participation and no points are gained or lost. The next match cycle begins automatically.
`
