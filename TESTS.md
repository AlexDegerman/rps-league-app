# 🧪 Test Suite

Comprehensive unit, integration, and UI tests covering backend services, game logic, economy systems, event orchestration, and frontend components.

---

## ⚙️ Backend Test Coverage

The backend services are tested using Vitest to verify database behavior, BigInt scaling boundaries, and stable match lifecycle execution.

- **Oracle Consult Route**: Verifies model fallback rotation, query caching, and IP-based rate limiting for API stability.
- **Leaderboard Service**: Tests SQL aggregations including player ranking, alphabetical tiebreaking, and time-windowed results.
- **Match Service**: Validates deterministic winner logic, pagination, and player stat aggregation.
- **Prediction Service**: Ensures bet validation, win/loss point calculations, 100k floor enforcement, and recovery code formatting.
- **Relic Service**: Tests loot table rolls, rarity boundaries, Smart Loot fallback behavior, modifiers, cap logic, duplicate prevention, persistence, and equipment state handling.
- **Global Event Service**: Coordinates event phases (cooldown, warning, active), validates SSE broadcasts, BigInt-safe scaling, and percentage calculations.
- **Festival Service**: Manages streak triggers, bonus tiers, cooldown and lockout rules, database updates, and scheduler safety windows.
- **IP Mask Utility**: Validates IPv4/IPv6 anonymization for database storage, human-readable log masking, proxy chain extraction, and edge-case fallback handling.

---

## 💻 Frontend Test Coverage

Frontend verification uses Vitest and React Testing Library to ensure correct rendering, state handling, and UI behavior during dynamic updates.

- **PendingMatchCard**: Confirms player rendering, bet button states, and countdown accuracy.
- **DashboardCard**: Tests betting flow ("ALL IN", floor clamping, AUTO toggle) and user store synchronization.
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
