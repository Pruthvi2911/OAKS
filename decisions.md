# The Decisions File (`decisions.md`) — Technical, Product & Safety Decisions

This document records all technical, architectural, product, safety, and data schema decisions made throughout the lifecycle of this project.

---

## 1. Core Technical Stack Decisions

| Category | Decision | Justification |
|---|---|---|
| **Framework** | Next.js 14 (App Router) + React | Provides modern client/server rendering, filesystem routing, and standard React state hooks. |
| **Language** | JavaScript (ES6+, Modules) | Explicit requirement: React + JavaScript (No TypeScript). `"type": "module"` set in `package.json`. |
| **Styling** | Tailwind CSS + Lucide Icons | Utility-first responsive styling with clean vector icons. |
| **Database** | Firebase Firestore Only | Firestore provides built-in multi-tab offline persistence and real-time document listeners without needing a custom backend or Realtime Database. |
| **State Management** | React Local / Context Hooks | No Redux needed. Local state paired with Firestore realtime listeners handles sync cleanly. |
| **Deployment Target** | Vercel | Seamless Next.js deployment platform. |

---

## 2. Product & UX Principles

1. **Whole-Deck View as Primary Control Surface**: The Ferry Master requires a complete visual overview of all 3 bays (LEFT, CENTER, RIGHT) simultaneously. Real loading is dynamic, and the operator must retain full manual control rather than being locked into a rigid wizard.
2. **Explainable Safety Engine**: Recommendations display explicit reasons explaining *why* a bay is recommended or rejected (e.g. `✓ Fits capacity`, `✓ Reduces imbalance`, `⚠ LEFT worsens balance`, `✕ RIGHT exceeds bay limit`).
3. **Weight Trust Model**: Effective weight is calculated using `vehicle.verifiedWeight ?? vehicle.declaredWeight`. Master-verified values always override driver estimates.
4. **Imbalance Metric**: Calculated as `Math.abs(leftWeight - rightWeight)` (left/right spread in kg). Placing weight in CENTER bay preserves left/right balance.
5. **Driver Duplicate Submission Guard**: Driver check-in button immediately switches to `[ CHECKING IN... ]` and disables submit to prevent duplicate submissions on weak networks.
6. **Dynamic Queue Ranking**: Queue position is calculated dynamically (`utils/queueSorting.js`) prioritizing `EMERGENCY` priority vehicles first, followed by creation timestamp. No static hardcoded position numbers.
7. **Offline Protection**: Cast Off is strictly disabled while offline or working with stale data to avoid departed state mismatch.

---

## 3. Component Architecture & UI Hierarchy

- **Master Dashboard (`/master`)**:
  - `MasterHeader`: Crossing metadata, live weight gauges, imbalance spread meter, connection status.
  - `FerryDeck`: 3-bay deck surface visualization with per-bay capacity bars and vehicle cards.
  - `QueuePanel`: Waiting staging queue with emergency priority badges.
  - `RecommendationPanel`: Safety engine decision rationale engine.
  - `WeightVerifyModal`: Scale weight verification modal.
  - `HazardModal`: Hazardous cargo confirmation modal.
- **Driver Check-in (`/driver`)**:
  - Check-in form with vehicle presets, hazard/emergency toggles, duplicate submit protection.
  - `TicketCard`: Displaying check-in code, dynamic queue position, wait estimate, and status.
- **Public Queue (`/queue`)**:
  - Terminal status board showing active boarding run and waitlist.

---

## 4. Safety Engine Contracts

- `evaluatePlacement(vehicle, bay, currentVehicles, ferryConfig)` -> Returns `{ valid, reasons, postPlacementState }`.
- `suggestPlacement(vehicle, currentVehicles, ferryConfig)` -> Returns `{ recommended, options, rationale, minImbalance }`.
- Test suite in `safety/__tests__/safetyEngine.test.js` covers 15 automated test cases with 100% pass rate.

---

## 5. Git Branching & Merge Protocol

- **`main`**: Production baseline branch.
- **`dev`**: Active integration & staging branch.
- **`feat/step-X-*`**: Isolated feature branch created per step.
- Every completed step requires:
  1. Automated/manual test verification.
  2. Updating `flow.md` and `decisions.md`.
  3. Git commit on feature branch -> Merge into `dev` -> Merge into `main`.
