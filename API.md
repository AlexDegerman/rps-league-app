# 🔌 API Reference

Full API documentation for RPS League. This covers all routes, the database schema, and environment variable requirements.

---

## 📑 Table of Contents
- [🔑 Environment Variables](#-environment-variables)
- [🗄️ Database Schema](#-database-schema)
- [🔌 API Endpoints](#-api-endpoints)

---

## 🔑 Environment Variables

### Frontend (`/frontend/.env.local`)
```bash
# Core API Connection
NEXT_PUBLIC_API_URL=http://localhost:5000

# Observability & Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://your-key@o12345.ingest.sentry.io/project-id

# Sentry Build Configuration
NEXT_PUBLIC_SENTRY_ORG=your-org
NEXT_PUBLIC_SENTRY_PROJECT=javascript-nextjs
```

### Backend (`/backend/.env`)
```bash
# Database & Security
DATABASE_URL=postgresql://postgres.your-project:[password]@aws-1-pooler.supabase.com:6543/postgres
CORS_ORIGIN=http://localhost:3000

# Infrastructure Automation
RESET_SECRET=your_long_random_secret

# AI Integration
GEMINI_API_KEY=your_gemini_api_key

# Observability & Operations
SENTRY_DSN=https://your-key@o12345.ingest.sentry.io/project-id
API_BASE_URL=http://localhost:5000
DISCORD_LOG_WEBHOOK=your_discord_log_url
DISCORD_FEEDBACK_WEBHOOK=your_discord_feedback_url
FEEDBACK_ADMIN_KEY=your_admin_secret
```

---

# 🗄️ Database Schema
RPS League uses PostgreSQL with NUMERIC types to handle high-frequency, large-scale arithmetic without precision loss.

---

## `users`
Real players (predictors) with persistent accounts and progression.

| Column | Type | Description |
| :--- | :--- | :--- |
| `user_id` (PK) | TEXT | Unique persistent identifier |
| `short_id` (UQ) | TEXT | Public profile ID (`nanoid(10)`) |
| `nickname` | TEXT | Auto-generated identity |
| `points` | NUMERIC | Current balance (100,000 floor) |
| `peak_points` | NUMERIC | All-time highest balance achieved |
| `all_time_peak` | NUMERIC | Persistent all-time peak (default 200,000) |
| `daily_peak` | NUMERIC | Highest balance reached today |
| `weekly_peak` | NUMERIC | Highest balance reached this week |
| `current_win_streak` | INT4 | Active consecutive wins |
| `max_win_streak` | INT4 | Record consecutive wins |
| `wins` | INT4 | Total resolved wins |
| `losses` | INT4 | Total resolved losses |
| `total_volume` | NUMERIC | Total cumulative points wagered |
| `biggest_win` | NUMERIC | Largest cumulative win session |
| `biggest_single_win` | NUMERIC | Largest win from a single prediction |
| `biggest_multiplier_win` | NUMERIC | Largest multiplier-boosted win |
| `biggest_multiplier_tier` | TEXT | Tier label of the biggest multiplier win |
| `biggest_match_mult` | NUMERIC | Highest total multiplier achieved in a single match |
| `total_pities_earned` | INT4 | Lifetime pity bonuses earned |
| `bonus_pity_count` | INT4 | Current pity accumulator |
| `total_flash_events_caught` | INT4 | Total flash events participated in |
| `lunar_events_caught` | INT4 | LUNAR flash events caught |
| `electric_events_caught` | INT4 | ELECTRIC flash events caught |
| `hellfire_events_caught` | INT4 | HELLFIRE flash events caught |
| `cards_events_caught` | INT4 | CARDS flash events caught |
| `first_flash_triggered` | BOOLEAN | Whether user has seen their first flash event |
| `consecutive_flash_streak` | INT4 | Current streak of consecutive flash events caught |
| `consecutive_flash_peak` | INT4 | All-time peak consecutive flash streak |
| `festivals_participated` | INT4 | Total festivals participated in |
| `festivals_triggered` | INT4 | Total festivals the user triggered |
| `laps` | INT4 | Prestige ascension count |
| `fastest_lap_bets` | INT4 | Fewest bets taken to complete a lap (speedrun) |
| `total_bets_at_last_ascension` | INT4 | Total bet count at last ascension |
| `equipped_relic` | TEXT | Key of currently equipped relic |
| `relic_cycle_counter` | INT4 | Counter used for relic proc tracking |
| `oracle_used_date` | TEXT | Date string of last Oracle prediction use |
| `oracle_streak` | INT4 | Current consecutive Oracle win streak |
| `oracle_max_streak` | INT4 | All-time Oracle win streak record |
| `bet_against_oracle_count` | INT4 | Times user has bet against the Oracle |
| `point_style_preference` | TEXT | Preferred point display style |
| `displayed_badges` | TEXT[] | Array of badge codes shown on profile |
| `total_achievements` | INT4 | Count of earned achievements |
| `has_used_auto_bet` | BOOLEAN | Whether idle auto-bet has ever been used |
| `utm_source` | TEXT | Attribution source from first visit |
| `linkedin_url` | TEXT | Optional LinkedIn profile link |
| `show_linkedin_badge` | BOOLEAN | Controls LinkedIn badge visibility |
| `joined_date` | INT8 | Account creation timestamp (ms) |
| `recovery_code` | TEXT (UQ) | Account recovery token |
| `recovery_tutorial_completed` | BOOLEAN | Whether user has completed the recovery code tutorial |

---

## `predictions`
User wagers and resolution data.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` (PK) | SERIAL | Internal sequence ID |
| `user_id` | TEXT | References `users.user_id` |
| `game_id` | TEXT | References `matches.game_id` |
| `pick` | TEXT | Chosen bot (player name) |
| `result` | TEXT | `WIN`, `LOSE`, or NULL (pending) |
| `bet_amount` | NUMERIC | Wagered points |
| `gain_loss` | NUMERIC | Net result after resolution |
| `created_at` | BIGINT | Unix timestamp (ms) |
| `bonus_tier` | TEXT | Bonus tier label (COMMON/RARE/EPIC/LEGENDARY) |
| `bonus_multiplier` | NUMERIC | Multiplier from bonus tier |
| `flash_event_type` | TEXT | Active flash event type at bet time |
| `flash_multiplier` | NUMERIC | Multiplier from flash event (default 1) |
| `streak_multiplier` | NUMERIC | Multiplier from win streak (default 1) |
| `relic_multiplier` | INT4 | Multiplier from equipped relic (default 1) |
| `festival_multiplier` | NUMERIC | Multiplier from active festival (default 1) |
| `festival_type` | TEXT | Active festival type at bet time |
| `total_multiplier` | NUMERIC | Combined multiplier applied to gain/loss |
| `bet_against_oracle` | BOOLEAN | Whether user bet against the Oracle's pick |

---

## `matches`
Bot vs bot Rock Paper Scissors simulations.

| Column | Type | Description |
| :--- | :--- | :--- |
| `game_id` (PK) | TEXT | Unique UUID v4 |
| `type` | TEXT | Match type discriminator |
| `time` | BIGINT | Match creation timestamp (ms) |
| `expires_at` | BIGINT | Betting window cutoff |
| `player_a_name` | TEXT | Bot A identifier |
| `player_a_played` | TEXT | Move: `ROCK`, `PAPER`, or `SCISSORS` |
| `player_b_name` | TEXT | Bot B identifier |
| `player_b_played` | TEXT | Move: `ROCK`, `PAPER`, or `SCISSORS` |

---

## `relics`
Discovered relics owned by users.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` (PK) | SERIAL | Internal sequence ID |
| `user_id` | TEXT | References `users.user_id` |
| `relic_key` | TEXT | Identifier for the relic type |
| `rarity` | TEXT | Rarity tier (COMMON → MYTHIC) |
| `found_at` | BIGINT | Discovery timestamp (ms) |
| `counter` | INT4 | General-purpose proc/usage counter |

---

## `user_achievements`
Records of earned achievements per user.

| Column | Type | Description |
| :--- | :--- | :--- |
| `user_id` (PK, FK) | TEXT | References `users.user_id` |
| `achievement_code` (PK) | TEXT | Unique achievement identifier |
| `earned_at` | BIGINT | Timestamp of earning (ms) |

---

## `utm_visits`
Raw UTM attribution event log.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` (PK) | SERIAL | Internal sequence ID |
| `utm_source` | TEXT | Source parameter value |
| `visited_at` | TIMESTAMPTZ | Timestamp of visit |

---

## `feedback_bans`
Operational control for feedback system abuse prevention.

| Column | Type | Description |
| :--- | :--- | :--- |
| `user_id` (PK) | TEXT | Restricted user identifier |
| `banned_at` | TIMESTAMPTZ | Timestamp of restriction |

---

### Notes
- `short_id` is a unique public identifier (`nanoid(10)`), but not used as a foreign key — all internal relationships rely on `user_id`
- `points` enforces a 100,000 floor at the application layer
- BigInt values are stringified at the API boundary and parsed back on the frontend

---

# 🔗 Relationships
- `predictions.user_id` → `users.user_id`
- `predictions.game_id` → `matches.game_id`
- `relics.user_id` → `users.user_id`
- `user_achievements.user_id` → `users.user_id`

---

# ⚡ Database Indexes

| Table | Column(s) | Reason |
| :--- | :--- | :--- |
| `predictions` | `user_id, created_at DESC` | Composite index for fast user history + activity feeds |
| `predictions` | `created_at` | Time-windowed leaderboard aggregation |
| `predictions` | `game_id` | Fast resolution lookup — `resolvePrediction` fetches all bets per game on every match result |
| `predictions` | `result, user_id` | Achievement checker win/loss sweep queries |
| `predictions` | `user_id, game_id` (UNIQUE) | Enforces one bet per user per game; relied on by `resolvePrediction` |
| `users` | `points` | Global leaderboard sorting |
| `users` | `peak_points` | Session peak leaderboard sorting |
| `users` | `all_time_peak DESC` | All-time leaderboard tab sorting |
| `users` | `laps, points DESC` | Speedrun/ascension leaderboard filtering and ordering |
| `matches` | `time` | Fast retrieval of recent matches (ASC) |
| `matches` | `time DESC` | Fast retrieval of recent matches (DESC) — used by match history queries |
| `matches` | `game_id` | Fast lookup for match resolution and joins |
| `matches` | `player_a_name` | Bot stats and by-player filtering |
| `matches` | `player_b_name` | Bot stats and by-player filtering |
| `relics` | `user_id` | FK not auto-indexed by Postgres — all relic lookups are `WHERE user_id = $1` |
| `user_achievements` | `user_id` | Fast achievement lookup per user |

---

# 🔌 API Endpoints

---

## 📡 Live Events
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/api/live` | Persistent SSE stream for real-time match events (`pending`, `result`, `prediction_result`, `festival_event`, `sync`) |
| GET | `/api/live/flash-state` | Active Flash Event state for a user (`?userId=`) |
| GET | `/api/live/festival-state` | Active Festival state and lockout countdown |

---

## 🎲 Matches (Bot Simulation Data)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/api/matches/pending` | Current in-progress match (returned immediately on page load) |
| GET | `/api/matches` | Paginated match history (`?page=&limit=`) |
| GET | `/api/matches/by-date` | Matches filtered by date (`?date=YYYY-MM-DD&page=&limit=`) |
| GET | `/api/matches/by-player` | Matches filtered by bot name (`?name=&page=&limit=`) |
| GET | `/api/matches/players` | List all bot competitor names |
| GET | `/api/matches/players/:name/stats` | Career stats for a specific bot |

---

## 📊 Leaderboards
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/api/leaderboard/unified` | Unified leaderboard — supports `?tab=daily\|weekly\|alltime\|laps\|speedrun\|achievements` with `sort=` and `dir=` params |
| GET | `/api/leaderboard/historical` | Historical leaderboard (`?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`) |
| GET | `/api/leaderboard/today` | Today's leaderboard snapshot |

---

## 👤 Users & Identity
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/users/recover` | Restore account via recovery code |
| POST | `/api/users/update-nickname` | Upsert user with new nickname (creates row if missing) |
| POST | `/api/users/update-linkedin` | Set or clear LinkedIn URL and badge visibility |
| PATCH | `/api/users/style-preference` | Update point display style preference |
| POST | `/api/users/ascend` | Prestige reset — resets points to 200k, increments `laps`, updates speedrun record, triggers SURGE festival |
| POST | `/api/users/recovery-tutorial-complete` | Mark recovery tutorial as completed for a user (`{ userId }`) |
| GET | `/api/users/profile/:shortId` | Public profile data (points, streak, laps, all-time peak, LinkedIn) |
| GET | `/api/users/recovery/:userId` | Fetch recovery code for the authenticated user |
| GET | `/api/users/check-name/:nickname` | Check nickname availability |
| GET | `/api/users/:userId/points` | Real-time balance, streak, and peak sync; also handles UTM attribution on first visit |
| GET | `/api/users/:userId/recovery-tutorial-status` | Check whether user has completed the recovery tutorial |
| GET | `/api/users/idle-eligible/:userId` | Check if user qualifies for idle auto-bet (laps ≥ 1 or points ≥ ascension threshold) |
| POST | `/api/users/:userId/auto-bet-used` | Mark that user has activated idle auto-bet |

---

## 🏆 Achievements & Badges
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/api/achievements/:shortId` | Full achievement list with earned status, stats, and displayed badges |
| PATCH | `/api/achievements/:shortId/badges` | Update displayed badge showcase (max 10, validated against earned set) |
| POST | `/api/achievements/badges-for-leaderboard` | Batch fetch badge data for a list of `shortIds` (used by leaderboard rows) |

---

## 🔮 Oracle
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/api/oracle` | Current Oracle side and whether user has used it today (`?userId=`) |
| POST | `/api/oracle/reset` | Auth-protected daily Oracle reset (called by GitHub Actions cron) |

---

## 💎 Relics
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/api/relics` | All relics owned by user (`?userId=`) |
| GET | `/api/relics/equipped` | Currently equipped relic with counter (`?userId=`) |
| POST | `/api/relics/equip` | Equip a relic by key |
| POST | `/api/relics/unequip` | Unequip current relic |

---

## 🎪 Festivals
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/festivals/participated` | Increment `festivals_participated` for a user (called client-side on receiving `festival_event` SSE) |

---

## 💬 Feedback & Ops
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/feedback` | Submit bug/suggestion with optional screenshot (multipart); rate-limited to 3 per 15 min |
| GET | `/api/feedback/status` | Check if user is banned from submitting feedback (`?userId=`) |
| GET | `/api/feedback/ban/:userId` | Admin one-click ban (requires `?key=` admin secret) |

---

## 🤖 Analytics & Stats
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/analysis` | AI Oracle query — Gemini-powered RAG with league telemetry context; 5 req/min rate limit, 5-min cache |
| GET | `/api/predictions/stats` | Global summary stats (user count, prediction count, match count, richest player, top streak) |
| GET | `/api/predictions/stats/daily` | Real-time daily ticker (volume, payout, win rate, MVP) |
| GET | `/api/predictions/stats/monthly` | Monthly stats report (`?year=&month=`) — new users, volume, biggest win, top streak, most active, high roller, top win rate |
| GET | `/api/admin/utm-stats` | UTM attribution breakdown — signups and visits per source |

---

## 🎯 Predictions
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/predictions` | Place a bet (userId, gameId, pick, betAmount, nickname, shortId) |
| GET | `/api/predictions/:userId/stats` | Per-user stats summary |
| GET | `/api/predictions/user/:userId/history` | Paginated bet history (`?page=&limit=&sort=`) |
| POST | `/api/predictions/reset/daily` | Auth-protected daily peak reset (Cron) |
| POST | `/api/predictions/reset/weekly` | Auth-protected weekly peak reset (Cron) |