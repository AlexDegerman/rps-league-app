# 🧪 Test Suite

Comprehensive unit, integration, and UI tests covering backend services, game logic, economy systems, event orchestration, and frontend components.

---

## ⚙️ Backend Test Coverage

The backend services are tested using Vitest to verify database behavior, BigInt scaling boundaries, and stable match lifecycle execution.

- **Oracle Features**: Verifies both Oracle Consultation and Daily Prophecy functionality, including AI model fallback, query caching, rate limiting, validation, response formatting, daily prophecy generation, user eligibility checks, oracle consumption, and reset endpoint security.
- **Leaderboard Service**: Tests SQL aggregations including player ranking, alphabetical tiebreaking, and time-windowed results.
- **Match Service**: Validates deterministic winner logic, pagination, and player stat aggregation.
- **Prediction Service**: Validates bet placement, prediction resolution, point gain/loss calculations, 100k point floor enforcement, relic mechanics, festival interactions, pagination, user statistics, global betting summaries, and database edge cases using mocked services and SQL routing.
- **Relic Service**: Tests loot table rolls, rarity boundaries, Smart Loot fallback behavior, modifiers, cap logic, duplicate prevention, persistence, equipment state handling, and unequip counter reset behavior.
- **Global Event Service**: Coordinates event phases (cooldown, warning, active), validates SSE broadcasts, BigInt-safe scaling, and percentage calculations.
- **World Boss Service**: Validates the full encounter lifecycle (IDLE → WARNING → ACTIVE → QUIET → COOLDOWN), participant scaling, damage and leaderboard logic, phase guards, reward and chest generation, relic interactions, point scaling, achievement evaluation, encounter persistence, restart recovery, external pause/resume integration, and global event coordination.
- **Festival Service**: Manages streak triggers, bonus tiers, cooldown and lockout rules, database updates, and scheduler safety windows.
- **IP Mask Utility**: Validates IPv4/IPv6 anonymization for database storage, human-readable log masking, proxy chain extraction, and edge-case fallback handling.

---

## 💻 Frontend Test Coverage

Frontend verification uses Vitest and React Testing Library to ensure correct rendering, state handling, and UI behavior during dynamic updates.

- **PendingMatchCard**: Confirms player rendering, bet button states, and countdown accuracy.
- **DashboardCard**: Tests betting interactions (MAX, floor clamping, AUTO toggle), user and UI store synchronization, animated balance updates, tooltips, notifications, sound controls, visual mode styling, and browser compatibility states.
- **Leaderboard Page**: Verifies default tab state, URL-based tab switching, and empty state handling.
- **Format Utilities**: Validates BigInt shorthand parsing, tiered formatting with decimal rules and caps, and match result calculation from player perspective.
- **Idle Bet Hook**: Tests early-return guard conditions (including document visibility, eligibility, processing state, and user validation), match expiration boundary behavior, idle-side selection, and prediction state transitions during asynchronous API interactions.

---

## ▶️ Running Tests

Tests are executed using Vitest in both backend and frontend packages.

### Backend

```bash
cd backend
npm run test
```

### Frontend

```bash
cd frontend
npm run test
```
