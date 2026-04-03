# RPS League Betting App

A fast-paced Rock Paper Scissors league web app where players bet virtual cosmetic points on live matches, track rankings, and explore analytics.

Originally built as a summer dev assignment for Reaktor as a simple match viewer, now rebuilt into a full real-time betting and analysis platform.

**Live demo:** https://rpsleaguegame.vercel.app/

![RPS League Demo](./assets/rps.gif)

---

## Gameplay & Betting Mechanics

- Players bet virtual points on fast-paced Rock Paper Scissors matches
- Matches appear every 5 seconds, with a 3-second betting window
- Dynamic odds:
  - **WIN:** +100% of your bet
  - **LOSE:** -50% of your bet
  - **Floor:** points never drop below 100,000
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

## Overview

- High-frequency match system (5s intervals, 3s decision window)
- Instant user creation with persistent ID and nickname
- Match history with search by player or date
- Leaderboards for:
  - Current points
  - Weekly gains
  - All-time peak
- Player profiles with nickname randomization and recovery codes
- AI-powered analysis using Gemini
- Full test coverage across backend services and frontend components

---

## Live Activity Feed

High-frequency, concurrency-aware event stream handling:

- Real user bets
- Global results
- Simulated demo traffic

Guarantees:
- No overlap between events
- Immediate visibility for user actions
- Continuous activity even during low traffic

---

## Architecture

| Layer | Stack |
|-------|-------|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Real-time | Server-Sent Events via `/api/live` |
| Database | Supabase PostgreSQL |
| Match system | Custom generator feeding SSE stream |

---

## Technical Challenges & Solutions

**SSE buffering in production**
Real-time events were delayed in deployment due to proxy buffering. Solved by disabling buffering: X-Accel-Buffering: no
**High-frequency UI ticker**
Built a custom event processing system using React refs and controlled update loops to handle a constant stream of events without UI stutter or state thrashing.

**Concurrency and event prioritization**
Designed the feed to prioritize real user events while still injecting demo traffic, ensuring no overlap and consistent pacing.

**Cold start resilience**
Implemented connection awareness and fallback messaging to handle backend cold starts without breaking the user experience.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/live` | SSE stream for live events |
| GET | `/api/matches` | Paginated match history |
| GET | `/api/matches/pending` | Active pending match |
| GET | `/api/matches/by-date` | Matches by date |
| GET | `/api/matches/by-player` | Matches by player |
| GET | `/api/matches/players` | All unique player names |
| GET | `/api/matches/players/:name/stats` | Player career stats |
| GET | `/api/leaderboard/historical` | Historical player leaderboard |
| GET | `/api/leaderboard/today` | Today's player leaderboard |
| GET | `/api/predictions/leaderboard` | All-time peak predictor leaderboard |
| GET | `/api/predictions/leaderboard/weekly` | Weekly gains leaderboard |
| GET | `/api/predictions/leaderboard/current` | Current points leaderboard |
| POST | `/api/predictions` | Submit a prediction |
| GET | `/api/predictions/:userId/points` | User points and peak |
| GET | `/api/predictions/:userId/stats` | User prediction stats |
| GET | `/api/predictions/recovery/:userId` | Get recovery code |
| POST | `/api/predictions/recover` | Recover profile by code |
| GET | `/api/stats` | Platform stats |
| POST | `/api/analysis` | AI Gemini query |

---

## Environment Variables
Frontend (`/frontend/.env.local`)
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
```
Backend (`/backend/.env`)
```bash
DATABASE_URL=your_supabase_connection_string
CORS_ORIGIN=http://localhost:3000
GEMINI_API_KEY=your_gemini_api_key
```
---

## How to Run
```bash
git clone https://github.com/yourusername/rps-league-betting.git
cd rps-league-betting
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

## Tests

**Backend (Vitest)**
- Analysis route — model fallback rotation, caching, rate limiting
- Leaderboard service — win ranking, alphabetical tiebreaking, date range padding
- Match service — winner logic, pagination, player stat aggregation
- Prediction service — bet validation, win/loss point calculation, floor enforcement, recovery code format

**Frontend (Vitest + React Testing Library)**
- PendingMatchCard — player rendering, bet button interaction, prediction state, countdown timer
- HomePage — points display, ALL IN button, Auto All-In toggle
- Leaderboard page — default tab, tab switching, URL sync, empty state

---

## Design Decisions

- Zero-friction onboarding for instant engagement
- SSE over WebSockets for simplicity and broad compatibility
- Concurrency-aware event stream for stability under load
- Profile recovery system for cross-device portability
- Mock match generator for self-contained deployment
- AI integration for exploratory analytics

---

## Future Improvements

- Friends system with social leaderboard
- Player vs player head-to-head statistics
- Expanded betting mechanics and risk systems
- Deeper AI-driven insights and trend detection