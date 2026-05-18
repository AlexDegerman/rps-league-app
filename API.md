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
NEXT_PUBLIC_SENTRY_ORG=alexdegerman
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
| `short_id` (UQ) | TEXT | Public profile ID |
| `nickname` | TEXT | Auto-generated identity |
| `points` | NUMERIC | Current balance (100,000 floor) |
| `peak_points` | NUMERIC | All-time highest balance achieved |
| `daily_peak` | NUMERIC | Highest balance reached today |
| `weekly_peak` | NUMERIC | Highest balance reached this week |
| `current_win_streak` | INT4 | Active consecutive wins |
| `max_win_streak` | INT4 | Record consecutive wins |
| `total_volume` | NUMERIC | Total cumulative points wagered |
| `biggest_single_win` | NUMERIC | Largest win from a single prediction |
| `joined_date` | INT8 | Account creation timestamp (ms) |
| `recovery_code` | TEXT | Account recovery token |
| `linkedin_url` | TEXT | Optional profile link |
| `show_linkedin_badge` | BOOLEAN | Controls badge visibility |

---

## `predictions`

User wagers and resolution data.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` (PK) | SERIAL | Internal sequence ID |
| `user_id` | TEXT | References `users.user_id` |
| `game_id` | TEXT | References `matches.game_id` |
| `pick` | TEXT | Chosen bot (player) |
| `result` | TEXT | WIN, LOSE, or NULL |
| `bet_amount` | NUMERIC | Wagered points |
| `gain_loss` | NUMERIC | Net result after resolution |
| `created_at` | BIGINT | Unix timestamp (ms) |

---

## `matches`

Bot vs bot Rock Paper Scissors simulations.

| Column | Type | Description |
| :--- | :--- | :--- |
| `game_id` (PK) | TEXT | Unique UUID v4 |
| `type` | TEXT | Match type discriminator |
| `time` | BIGINT | Match creation timestamp (ms) |
| `expires_at` | BIGINT | Betting window cutoff |
| `player_a_played` | TEXT | Move: ROCK, PAPER, or SCISSORS |
| `player_b_played` | TEXT | Move: ROCK, PAPER, or SCISSORS |

---

## `feedback_bans`

Operational control for feedback system abuse prevention.

| Column | Type | Description |
| :--- | :--- | :--- |
| `user_id` (PK) | TEXT | Restricted user identifier |
| `banned_at` | TIMESTAMPTZ | Timestamp of restriction |

---

### Notes

- `short_id` is a unique public identifier, but not used as a foreign key
- All internal relationships rely on `user_id` for consistency

# 🔗 Relationships

- `predictions.user_id` → `users.user_id`
- `predictions.game_id` → `matches.game_id`

---

# ⚡ Database Indexes

| Table | Column(s) | Reason |
| :--- | :--- | :--- |
| `predictions` | `user_id, created_at DESC` | Composite index for fast user history + activity feeds |
| `predictions` | `created_at` | Time-windowed leaderboard aggregation |
| `users` | `points` | Global leaderboard sorting |
| `users` | `peak_points` | All-time leaderboard sorting |
| `matches` | `time` | Fast retrieval of recent matches |
| `matches` | `game_id` | Fast lookup for match resolution and joins |
---

# 🔌 API Endpoints

---

## 📡 Live Events

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/api/live` | Persistent SSE stream for real-time match events |
| GET | `/api/live/flash-state` | Active Flash Event state for a user |

---

## 🎲 Matches (Bot Simulation Data)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/api/matches/pending` | Current in-progress match |
| GET | `/api/matches` | Paginated match history |
| GET | `/api/matches/players` | List all bot competitors |
| GET | `/api/matches/players/:name/stats` | Career stats for a specific bot |

---

## 📊 Leaderboards

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/api/leaderboard/unified` | Sorted leaderboard (Daily/Weekly/All-Time) |

---

## 👤 Users & Identity (Real Players)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/users/recover` | Restore account via recovery code |
| POST | `/api/users/update-nickname` | Sync new randomized nickname |
| GET | `/api/users/profile/:shortId` | Fetch user dashboard data |
| GET | `/api/users/:userId/points` | Real-time balance and streak sync |

---

## 💬 Feedback & Ops

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/feedback` | Submit bug/suggestion with screenshots |
| GET | `/api/feedback/status` | Check if user is restricted |
| GET | `/api/feedback/ban/:userId` | Admin one-click ban |

---

## 🤖 Analytics & Stats

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/analysis` | AI Oracle query (Gemini-powered RAG) |
| GET | `/api/stats/daily` | Real-time ticker stats (Volume, Payout, MVP) |
| POST | `/api/predictions/reset/daily` | Auth-protected daily reset (Cron) |