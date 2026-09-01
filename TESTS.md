# 🧪 Test Suite

Comprehensive unit, integration, and UI tests covering backend services, game logic, economy systems, event orchestration, persistence, and complex frontend interactions.

---

## ⚙️ Backend Test Coverage

The backend services are tested using Vitest to verify database behavior, BigInt scaling boundaries, and stable match lifecycle execution.

- **Prediction Service**: Validates bet placement, prediction resolution, point gain/loss calculations, 100k point floor enforcement, relic mechanics, festival interactions, pagination, user statistics, global betting summaries, database edge cases, and transactional resolution behavior using mocked services and SQL routing. Tests verify that `prediction_result` is emitted only after COMMIT, failed transactions roll back correctly, one user's failure does not affect other bettors, each bettor receives an independent transaction, clients are released on failure, and Arkalon charges occur within the transaction.
- **Arkalon Features**: Verifies both Arkalon Consultation and Daily Prophecy functionality, including AI model fallback, query caching, rate limiting, validation, response formatting, daily prophecy generation, user eligibility checks, Arkalon consumption, and reset endpoint security.
- **Flash Event Service**: Tests event triggering, first-flash behavior, relic modifiers, bet consumption, event lifecycle, and expiry handling.
- **Leaderboard Service**: Tests SQL aggregations including player ranking, alphabetical tiebreaking, and time-windowed results.
- **Match Service**: Validates deterministic winner logic, pagination, and player stat aggregation.
- **Relic Service**: Tests loot table rolls, rarity boundaries, Smart Loot fallback behavior, modifiers, cap logic, duplicate prevention, persistence, equipment state handling, and unequip counter reset behavior.
- **Global Event Service**: Coordinates event phases (cooldown, warning, active), validates SSE broadcasts, BigInt-safe scaling, and percentage calculations.
- **World Boss Service**: Validates the full encounter lifecycle (IDLE → WARNING → ACTIVE → QUIET → COOLDOWN), participant scaling, damage and leaderboard logic, phase guards, reward and chest generation, relic interactions, point scaling, achievement evaluation, encounter persistence, restart recovery, external pause/resume integration, and global event coordination.
- **Festival Service**: Manages streak triggers, bonus tiers, cooldown and lockout rules, database updates, and scheduler safety windows.
- **IP Mask Utility**: Validates IPv4/IPv6 anonymization for database storage, human-readable log masking, proxy chain extraction, and edge-case fallback handling.
- **Neon Paradise Service**: Tests bonus stage triggering, session creation and retrieval, client/reconnect state, stage action routing and core stage mechanics, payout calculations, server-side validation, and Neon Paradise milestone tracking.
- **Match Generator Service**: Tests sequential match generation, database persistence, callback ordering, prediction-window timing, duplicate instance prevention, and cleanup behavior.

---

## 💻 Frontend Test Coverage

Frontend verification uses Vitest and React Testing Library to ensure correct rendering, state handling, and UI behavior during dynamic updates.

- **PendingMatchCard**: Confirms player rendering, bet button states, and countdown accuracy.
- **DashboardCard**: Tests betting interactions (MAX, floor clamping, AUTO toggle), user and UI store synchronization, animated balance updates, tooltips, notifications, sound controls, visual mode styling, and browser compatibility states.
- **Leaderboard Page**: Verifies default tab state, URL-based tab switching, and empty state handling.
- **Format Utilities**: Validates BigInt shorthand parsing, tiered formatting with decimal rules and caps, and match result calculation from player perspective.
- **Idle Bet Hook**: Tests early-return guard conditions (including document visibility, eligibility, processing state, and user validation), match expiration boundary behavior, idle-side selection, and prediction state transitions during asynchronous API interactions.
- **Neon Paradise Bonus Stages**: Verifies that all nine bonus stage components render correctly.
- **Neon Paradise Container**: Verifies inactive-state rendering, correct bonus stage selection, completed reward rendering, and reward collection state clearing.
- **Match Components**: Verifies prediction success, failure and timeout flows, match rendering, prediction results, loading states, pagination boundaries, and Rock-Paper-Scissors winner logic.
- **Result Animation Overlay**: Verifies win and loss result rendering, bonus tiers and multipliers, Lucky Save, streak bonuses, festival effects, global event echo calculations, and relic slam timing and result state transitions.
- **Recovery Tutorial**: Verifies profile eligibility, tutorial completion status, tutorial rendering, recovery section scrolling and positioning, dismissal, completion requests, scroll restoration, and position updates on scroll and resize events.
- **World Boss Arena**: Verifies missing boss handling, boss model rendering, assembly and death states, encounter countdown calculations, hit and miss result flows, sound triggers, damage number pooling, and damage number expiration.