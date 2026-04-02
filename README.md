# RPS League

A full-stack web application for exploring Rock Paper Scissors League match results and player statistics. Built as a Reaktor summer developer assignment.

**Live demo:** https://rps-league-eight.vercel.app  
> Match data is frozen as of the last cached snapshot (March 2026) - the Reaktor API this project depended on is no longer in service. A self-contained version with a mock match generator is in development.

![RPS League Demo](./assets/rps.gif)
---

## Overview

RPS League consumes the Reaktor RPS League API and presents match data through a clean interface. Users can browse live match results, search match history by date or player, view player profiles, and explore leaderboards.

---

## Architecture

- **Frontend** (Next.js) handles all UI and user interaction, fetching data from the backend API
- **Backend** (Node.js + Express) acts as a proxy for the external Reaktor API, normalizing responses and managing caching
- **In-memory cache** with disk persistence avoids redundant API fetches across server restarts, the full match history (~185,000 matches) is fetched once and served from memory
- **SSE live stream** connects to the Reaktor live endpoint and prepends new matches in real time

---

## Tech Stack

**Frontend**
- Next.js, React, TypeScript
- Tailwind CSS

**Backend**
- Node.js, Express, TypeScript

---

## Features

- View latest match results with live updates
- View match results for a specific day
- View match results for a specific player
- Player profile pages with career statistics (total matches, wins, losses, ties, win rate)
- Today's leaderboard based on number of wins
- Historical leaderboard for a selected date range

---

## API Design

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/matches` | Paginated latest matches |
| GET | `/api/matches/by-date` | Matches for a specific date (`?date=YYYY-MM-DD`) |
| GET | `/api/matches/by-player` | Matches for a specific player (`?name=...`) |
| GET | `/api/matches/players` | All unique player names |
| GET | `/api/players/:name/stats` | Career statistics for a player |
| GET | `/api/leaderboard/today` | Today's leaderboard |
| GET | `/api/leaderboard/historical` | Leaderboard for a date range (`?startDate=...&endDate=...`) |

---

## How to Run

> **Note:** This project requires a private Reaktor API token to fetch match data. Local setup is only possible with a valid token. Use the [live demo](https://rps-league-eight.vercel.app) to explore the application.

**Prerequisites:** Node.js 18+, npm
```bash
# Clone the repository
git clone https://github.com/AlexDegerman/rps-league.git
cd rps-league
```

**Backend**
```bash
cd backend
cp .env.example .env   # fill in RPS_API_BASE, RPS_API_TOKEN, CORS_ORIGIN
npm install
npm run dev
```

**Frontend**
```bash
cd frontend
cp .env.local.example .env.local   # fill in NEXT_PUBLIC_API_URL=http://localhost:5000
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> On first run the backend fetches the full match history (~300 pages). Match data will appear incrementally as pages load.

---

## Design Decisions

**Three-tier caching** The Reaktor API serves ~185,000 matches across 300+ pages. Fetching this on every request is not viable. The backend builds an in-memory cache on startup, persists it to disk, and reloads from disk on restart to avoid re-fetching. A promise lock prevents duplicate concurrent fetches.

**Separate history and live arrays** Sorting 170,000+ nearly-ordered items caused V8's TimSort fast-path to behave unexpectedly, burying live matches. Keeping history and live matches in separate arrays and returning `[...live, ...history]` eliminates the need for sorting entirely.

**Timestamp normalization** The `/history` endpoint returns timestamps inconsistently as UTC strings, Unix seconds, or Unix milliseconds depending on the record. The SSE stream returns milliseconds. All timestamps are normalized to milliseconds on ingest via a `normalizeMatch` function.

**SSE authentication workaround** The native browser `EventSource` API does not support custom headers. The `eventsource` npm package was used instead, which accepts a custom fetch function allowing Bearer token injection.

**Backend as proxy** All Reaktor API communication happens on the backend, keeping the API token out of the browser and allowing response normalization and caching before data reaches the frontend.

---

## Future Improvements

- Match outcome prediction feature using a mock live match generator
- Player vs player head-to-head statistics
- Win rate trends over time with charts
- Unit and integration tests for cache logic and leaderboard calculations