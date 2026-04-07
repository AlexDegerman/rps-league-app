# 🎲 RPS League App

A fast-paced Rock Paper Scissors league web app where players bet virtual cosmetic points on live matches, track rankings, and explore analytics.

> 🚨 **Project Evolution:** This application is a full-scale rebuilding of my original **[RPS League](https://github.com/AlexDegerman/rps-league)** (originally built for a Reaktor developer assignment). While the initial version served as a static match viewer, this "App" version is a concurrency-aware betting engine engineered for **Infinite Scaling** and real-time user engagement.

**Live demo:** [https://rpsleaguegame.vercel.app/](https://rpsleaguegame.vercel.app/)

![RPS League Demo](./assets/rps.gif)

---
## 📑 Table of Contents

* [🕹️ Gameplay & Betting Mechanics](#️-gameplay--betting-mechanics)
* [📋 Overview](#-overview)
* [⚡ Live Activity Feed](#-live-activity-feed)
* [🏗️ Architecture](#️-architecture)
* [🛠️ Technical Challenges & Solutions](#️-technical-challenges--solutions)
    * [SSE Buffering](#sse-buffering-in-production)
    * [High-frequency UI Ticker](#high-frequency-ui-ticker-100000-daily-events)
    * [Concurrency & Prioritization](#concurrency-and-event-prioritization)
    * [Handling Extreme Numbers (BigInt)](#handling-extreme-numbers-quadrillions--vigintillions)
* [🤖 AI Oracle & Analytics](#-ai-oracle--analytics)
* [📱 Mobile & PWA Experience](#-mobile--pwa-experience)
* [🧪 Tests](#-tests)
* [🎨 Design Decisions](#-design-decisions)
* [🚀 CI/CD & Automation](#-cicd--automation)
* [🚀 Future Improvements](#-future-improvements)
* [🔌 API Endpoints](#-api-endpoints)
* [🔑 Environment Variables](#-environment-variables)
* [📦 How to Run](#-how-to-run)
* [🗄️ Database Schema](#️-database-schema)
* [📱 Device Compatibility](#-device-compatibility)

## 🕹️ Gameplay & Betting Mechanics

- Players bet virtual points on fast-paced Rock Paper Scissors matches
- Matches appear every 5 seconds, with a 3-second betting window
- Dynamic odds:
  - **WIN:** +100% of your bet
  - **LOSE:** -50% of your bet
  - **Floor:** points never drop below 100,000
  - **Bonus System**: 40% chance per match to trigger a Tiered Bonus.
    - On Win: Gain an extra 100% to 1000% bonus points.
    - On Loss: Lose 20% to 100% fewer points.
    - Tiers: Common, Rare, Epic, and Legendary (with unique UI glows and confetti).
    - Guarantees a bonus at least every 4 bets if it doesn’t occur naturally from the 40% base chance
- Points contribute to:
  - Current points
  - Weekly gains
  - All-time peak leaderboard
- Live feed shows prioritized, high-frequency results from:
  - Your own bets (instant feedback)
  - Other players
  - Demo traffic for continuous activity
- Zero-friction onboarding with instant anonymous play (random nickname, no login)

---

## 📋 Overview

- High-frequency match system (5s intervals, 17,000+ daily events)
- Instant user creation with persistent ID and nickname
- Massive Match History: Optimized to handle and query a dataset of 10,000+ matches.
- Unified Ranking Engine: Dual leaderboards for Players and Predictors with deep-linkable URL state, supporting dynamic time-filtering (Daily/Weekly/All-Time) and multi-metric sorting (Points, Gained, Peak, Win Rate).
- Player profiles with nickname randomization and recovery codes
- AI-powered analysis using Gemini
- Full test coverage across backend services and frontend components
- Live League Insights: Live Stat Ticker showing daily betting volume, net community gains, and Daily MVP, updates every 15 seconds
- Infinite Scaling: Engineered with native BigInt support to handle astronomical point values (Sextillions, Vigintillions, and beyond) without precision loss.

---

## ⚡ Live Activity Feed

High-frequency, concurrency-aware event stream handling:

- Real user bets
- Global results
- Simulated demo traffic

Guarantees:
- No overlap between events
- Immediate visibility for user actions
- Continuous activity even during low traffic

---

## 🏗️ Architecture

| Layer | Stack |
|-------|-------|
| Database | Supabase PostgreSQL (Validated on 10k+ record datasets) |
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript, Google Gemini API |
| Real-time | Server-Sent Events via `/api/live` |
| Database | Supabase PostgreSQL |
| Testing | Vitest, React Testing Library |
| Match system | Custom generator feeding SSE stream |

## 🛠️ Technical Challenges & Solutions

**SSE buffering in production**
Real-time events were delayed in deployment due to proxy buffering. Solved by disabling buffering via the X-Accel-Buffering: no header, ensuring instant delivery of match results.

**High-frequency UI ticker (100,000+ daily events)**
Handling a constant stream of ~1.2 events per second (100,000+ daily) posed a risk of state thrashing and main-thread blocking. I engineered a custom event processor using React refs as a high-speed staging buffer and a 50ms interval-based update loop. By utilizing hardware-accelerated CSS (transform: translateX) and will-change: transform, the ticker maintains a smooth 60fps by offloading animations to the GPU.

**Concurrency and event prioritization**
Designed a non-blocking feed that prioritizes real user actions over simulated demo traffic. Used a weighted splice logic to ensure "Live" user bets are injected immediately into the front of the processing queue, guaranteeing zero-latency feedback for players.

**Real-Time Connection Guarding & State Monitoring**
Engineered a robust connection-state monitor to manage "stale" event streams and intermittent network drops. Implemented heartbeat tracking and active status messaging to ensure seamless UI transitions and zero-data-loss during session interruptions.

**Handling Extreme Numbers (Quadrillions → Vigintillions)**
Standard JavaScript Numbers (IEEE 754) lose integer precision past ~9 quadrillion (2⁵³−1). In a high-frequency betting system with 100%+ multipliers, this limit was exceeded within hours. I refactored the full stack—including PostgreSQL numeric fields (NUMERIC(100,0)), Node.js backend, and React frontend—to use native BigInt. This allows safe calculation, storage, and rendering of point values up to the Vigintillions, even under extreme betting volumes.

---

## 🤖 AI Oracle & Analytics
The platform features "The Oracle", a custom-tuned AI analyst powered by Google Gemini. Unlike standard chatbots, The Oracle is a domain-specific agent designed to provide snarky, data-driven insights into the RPS league.

**Key AI Features:**
- **Context-Aware Grounding**: Injects real-time league telemetry and historical data from a 10,000+ match dataset into the model context via XML-tagged data structures.
- **Resilient Model Fallback**: Rotates across gemini-2.0-flash, gemini-flash-lite, and gemini-pro to maintain uptime during 503/429 errors.
- **Intent Guardrailing**: Strict system instructions prevent hallucinations or off-topic queries. Refuses non-RPS topics, maintaining persona and reducing token costs.
- **Performance Optimization**: In-memory TTL cache and IP-based rate limiting to prevent abuse and minimize latency.
- **Strategic Analytical Presets**: Includes a curated set of “one-tap” queries designed to reveal hidden league patterns. These presets guide users in exploring underlying PostgreSQL telemetry, such as move frequency heatmaps and real-time house edge, transforming raw data into actionable betting insights.

---

## 📱 Mobile & PWA Experience

RPS League is designed with a mobile-first approach, leveraging modern PWA standards to deliver a fast, app-like experience across devices.

- **Adaptive Leaderboard Architecture**: On smaller screens, the leaderboard dynamically pivots from a wide table into a specialized 14-column grid. This ensures high-density data—including Wins, Losses, Points, and Peak Performance—remains perfectly aligned and readable without horizontal scrolling.

- **PWA Install Experience**: Configured via `manifest` and Next.js Metadata API, enabling installable app behavior on mobile and desktop. Includes optimized icons and rich metadata for a polished, native-like installation prompt.

- **Native-Feel Interactions**: Touch-friendly UI with optimized tap targets for betting actions (e.g., "ALL IN") and a real-time live feed that prepends new matches instantly, designed for seamless thumb-based navigation.

---

## 🧪 Tests

**Backend (Vitest)**
- **Analysis Route**: Verifies model fallback rotation, caching, and rate limiting to ensure API stability.
- **Leaderboard Service**: Tests SQL aggregations including win ranking, alphabetical tiebreaking, and date range padding.
- **Match Service**: Validates deterministic winner logic, pagination offsets, and player stat aggregation.
- **Prediction Service**: Ensures correct bet validation, win/loss point calculations, 100k floor enforcement, and secure recovery code formatting.

**Frontend (Vitest + React Testing Library)**
- **PendingMatchCard**: Confirms correct player rendering, interactive bet button states, and countdown timer accuracy.
- **HomePage**: Tests core betting loop, "ALL IN" button logic, Auto All-In state persistence, and hydration-safe points display.
- **Leaderboard Page**: Verifies default tab states, URL-synchronized tab switching, and empty state handling for new players.

---

## 🎨 Design Decisions

- **Zero-friction onboarding**: Instant anonymous play with random nickname generation
- **SSE over WebSockets**: Chosen for simplicity, lower overhead, and better serverless compatibility
- **Concurrency-aware event stream**: Guaranteed stability and zero overlap between real user bets and demo traffic
- **Profile recovery system** for cross-device portability
- **Mock match generator** for self-contained deployment
- **Production-hardened AI**: Resilient, grounded, and rate-limited analytics engine

---

## 🚀 CI/CD & Automation

The RPS League stack is fully automated via **GitHub Actions** to manage testing, deployment, and high-frequency maintenance.

### Pipeline Overview
| Stage | Tool | Purpose |
| :--- | :--- | :--- |
| **Testing** | Vitest | ~28s suites for Betting Loops & API logic |
| **Deployment** | Vercel / Render | Zero-touch CD after passing CI |
| **Maintenance** | Cron Jobs | Daily/Weekly leaderboard resets |

### Key Workflows
- **Leaderboard Engine:** Automated `POST` to `/api/predictions/reset` keeps `daily_peak` and `weekly_peak` accurate.
- **Vercel Deployment Check:** Dispatches status updates to ensure only successful builds reach production.
- **Environment Parity:** Validates `RESET_SECRET` and `DATABASE_URL` across Dev/Staging/Prod to prevent misconfigurations.

---

## 🚀 Future Improvements

- Friends system with social leaderboard
- Player vs player head-to-head statistics
- Dynamic Risk & Multiplier Engine: Asymmetric betting system with “Flash Events” with increased gain and loss rates to enhance strategic depth.
- Deeper AI-driven insights and trend detection
- Cosmetic Prestige System: Spend earned points on profile customizations, including unique name colors, tiered badges, and exclusive icon sets to stand out on the leaderboards.

---

## 🔌 API Endpoints

### Live Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/live` | SSE stream for live match events |
| GET | `/api/matches/pending` | Active pending match |
| GET | `/api/matches` | Paginated match history |
| GET | `/api/matches/by-date` | Matches filtered by date |
| GET | `/api/matches/by-player` | Matches filtered by player |
| GET | `/api/matches/players` | List all unique player names |
| GET | `/api/matches/players/:name/stats` | Player career stats |

### Leaderboards & Rankings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leaderboard/today` | Today's player leaderboard |
| GET | `/api/leaderboard/historical` | Historical player leaderboard |
| GET | `/api/predictions/leaderboard/unified?tab=[period]&sort=[metric]` | Unified predictor leaderboard with time filters and sortable metrics |

### User Predictions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/predictions` | Submit a prediction |
| GET | `/api/predictions/:userId/points` | Get user points and peak |
| GET | `/api/predictions/:userId/stats` | User prediction stats |
| GET | `/api/predictions/recovery/:userId` | Get recovery code |
| POST | `/api/predictions/recover` | Recover profile by code |
| GET | `/api/predictions/check-name/:nickname` | Check nickname availability |

### Automated Peak Resets
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/predictions/reset/daily` | Reset `daily_peak` (called by GitHub Actions cron) |
| POST | `/api/predictions/reset/weekly` | Reset `weekly_peak` (called by GitHub Actions cron) |

### Stats & Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/predictions/stats` | Platform-wide statistics |
| GET | `/api/predictions/stats/daily` | Daily betting stats and MVP |
| POST | `/api/analysis` | AI Oracle query (Gemini) |

---

## 🔑 Environment Variables
Frontend (`/frontend/.env.local`)
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
```
Backend (`/backend/.env`)
```bash
# Database & Security
DATABASE_URL=your_supabase_connection_string
CORS_ORIGIN=http://localhost:3000

# Infrastructure Automation
# Secret key for GitHub Actions reset workflows
RESET_SECRET=your_long_random_secret

# AI Integration
GEMINI_API_KEY=your_gemini_api_key

# Observability (Optional)
# Leave blank to disable administrative audit logging
DISCORD_LOG_WEBHOOK=your_discord_webhook_url
```
---

## 📦 How to Run
```bash
git clone https://github.com/AlexDegerman/rps-league-app.git
cd rps-league-app
```

**Backend**
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

**Frontend**
```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Open http://localhost:3000

---

# 🗄️ Database Schema

This project uses **Supabase PostgreSQL** to manage real-time betting, match history, and global leaderboards. The schema is optimized for high-frequency writes and real-time state synchronization.

---

### `matches`

The source of truth for the league's match history. Each row represents a completed match.

| Column | Type | Description |
| :--- | :--- | :--- |
| **game_id** (PK) | TEXT | Unique UUID v4 for the match |
| **type** | TEXT | Event discriminator (hardcoded as `GAME_RESULT`) |
| **time** | BIGINT | Unix timestamp (ms) of match creation |
| **expires_at** | BIGINT | End of 3-second betting window (start + duration) |
| **player_a_name** | TEXT | Name of the first competitor |
| **player_a_played** | TEXT | Move: `ROCK`, `PAPER`, or `SCISSORS` |
| **player_b_name** | TEXT | Name of the second competitor |
| **player_b_played** | TEXT | Move: `ROCK`, `PAPER`, or `SCISSORS` |

---

### `users`

Global user profiles with persistent point tracking and account recovery logic.

| Column | Type | Description |
| :--- | :--- | :--- |
| **user_id** (PK) | TEXT | Unique persistent identifier |
| **points** | BIGINT | Current balance (**100,000 floor enforced**) |
| **peak_points** | BIGINT | All-time highest balance achieved |
| **daily_peak** | BIGINT | Highest balance today (reset via GitHub Cron) |
| **weekly_peak** | BIGINT | Highest balance this week (reset via GitHub Cron) |
| **nickname** | TEXT | Auto-generated display name (adjective + color + animal). Users can randomize to a new combination. |
| **recovery_code** | TEXT | Unique slug (e.g., `swift-tiger-1234`) |
| **bonus_pity_count** | INTEGER | Consecutive bets without a bonus |

---

### `predictions`

Tracks all user wagers. Composite constraints prevent multiple bets on the same game.

| Column | Type | Description |
| :--- | :--- | :--- |
| **id** (PK) | SERIAL | Internal unique incrementing ID |
| **user_id** | TEXT | Bettor ID (references `users.user_id`) |
| **game_id** | TEXT | Match ID (references `matches.game_id`) |
| **pick** | TEXT | Chosen winner (`Player A` or `Player B`) |
| **bet_amount** | BIGINT | Points wagered |
| **result** | TEXT | Outcome: `WIN`, `LOSE`, or `NULL` (if pending) |
| **gain_loss** | BIGINT | Net change (Win: +100% / Loss: -50% of bet) |
| **created_at** | BIGINT | Timestamp for volume and daily stats |

---

**Relationships:**

- `predictions.user_id` → `users.user_id`  
- `predictions.game_id` → `matches.game_id`

---

## 📱 Device Compatibility

This application uses native BigInt to safely handle extremely large point values (into the vigintillions) without precision loss.

- Supported: Modern mobile and desktop browsers (iOS 14+, Android 9+, Chrome, Firefox, Safari)
- Not supported: Older devices and browsers without BigInt support (e.g. iPhone 6/7, Internet Explorer)

This ensures leaderboard accuracy and consistent gameplay at high point values.

---

## ⚠️ Disclaimer

This project is a non-commercial portfolio piece created for educational purposes.  
All points are strictly virtual and have no real-world value.  
No real-money gambling or payouts are offered.

---

## 🔮 Oracle Privacy & Monitoring
To maintain system stability and fine-tune AI behavior, anonymized queries are logged to a private administrative audit channel.
- **Privacy**: IP addresses are masked (e.g., `192.168.x.x`). 
- **Security**: No authentication tokens, passwords, or personally identifiable information are logged or stored
- **Observability**: Enables real-time monitoring of model behavior, including hallucinations and edge-case detection during live matches