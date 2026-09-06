# 🚢 Rural Ferry Staging & Weight-Balanced Boarding Tool

A real-time, offline-resilient, weight-balanced boarding control surface for rural ferry masters.

---

## 🌟 Key Features

1. **Whole-Deck Primary Control Surface (`/master`)**: A 3-bay visual deck layout (LEFT, CENTER, RIGHT) displaying live weight totals, capacity progress meters, and left/right imbalance spread gauges.
2. **Explainable Rationale Engine (`safety/suggestPlacement.js`)**: Evaluates all 3 deck bays simultaneously and explains *why* a placement is recommended or rejected (e.g., `✓ Fits capacity`, `✓ Keeps left/right spread within 1,000 kg`, `⚠ LEFT worsens balance`, `✕ RIGHT exceeds bay limit`).
3. **Pure JavaScript Safety Engine (`safety/validateDeck.js`)**: Isolated, testable safety module enforcing hard capacity limits, bay thresholds, maximum imbalance bounds (1,000 kg), hazardous cargo confirmation, and weight trust precedence (`verifiedWeight ?? declaredWeight`).
4. **Driver Self Check-In (`/driver`)**: Mobile check-in interface generating unique check-in codes (e.g. `FERRY-7K42`), ticket cards, wait time estimates, and duplicate submission debouncing (`[ CHECKING IN... ]`).
5. **Dynamic Queue Ranking (`utils/queueSorting.js`)**: Emergency vehicles (Ambulance) receive queue priority, but do NOT bypass safety limits. Queue positions update dynamically based on live deck changes.
6. **Public Queue Board (`/queue`)**: Terminal board for public display showing active deck load capacity and departure countdown.
7. **Offline Resilience & Cast Off Protection**: Multi-tab Firestore persistence with real-time `onSnapshot` sync. Cast Off is strictly disabled during offline/stale state.
8. **Multi-Master Lock (`components/master/MultiMasterGuard.js`)**: Restricts secondary master sessions to `VIEW ONLY` mode to prevent conflicting deck operations across devices.

---

## 🌿 Git Branching Strategy & Development History

This project was built following a strict production-grade Git branching workflow. Each step of development was isolated in a dedicated feature branch, verified via unit/integration tests, merged into `dev` for staging integration, and finally merged into `main` for release.

```text
  main (Production Baseline) ───────────────────────────────────────────────────────────────────────► Latest
    │                                                                                                   ▲
    ├─► dev (Staging Integration) ──► Step 1 ──► Step 2 ──► Steps 3-7 ──► Step 8 ──► Step 9 ──► UI ───┤
    │                                   ▲           ▲           ▲            ▲           ▲        ▲
    ├─► feat/step-1-foundation ──────────┘           │           │            │           │        │
    ├─► feat/step-2-safety-engine ───────────────────┘           │            │           │        │
    ├─► feat/step-3-master-deck ─────────────────────────────────┤            │           │        │
    ├─► feat/step-4-driver-queue ────────────────────────────────┤            │           │        │
    ├─► feat/step-5-6-7-release ─────────────────────────────────┘            │           │        │
    ├─► feat/step-8-firestore-wiring ─────────────────────────────────────────┘           │        │
    └─► feat/step-9-numberplate-smartload ────────────────────────────────────────────────┘        │
        (UI fix commits applied directly on main after step 9) ──────────────────────────────────────┘
```

### Feature Branch Progression Breakdown

| Branch Name | Primary Scope & Deliverables | Verification / Test Outcome |
|---|---|---|
| **`main`** | Production baseline branch containing stable, release-ready code. | Builds cleanly (`npm run build`). |
| **`dev`** | Integration and staging branch where feature branches are merged. | Verified full system integration. |
| **`feat/step-1-foundation`** | Initialized Next.js 14 App Router project, Tailwind CSS, Firebase SDK, constants, mock seed data, `flow.md`, and `decisions.md`. | Verified directory structure & schema keys. |
| **`feat/step-2-safety-engine`** | Implemented pure JS safety engine (`validateDeck.js`, `suggestPlacement.js`) and executable test suite (`safetyEngine.test.js`). | **15/15 Automated Unit Tests Passing**. |
| **`feat/step-3-master-deck`** | Built 3-bay whole-deck control surface (`/master`), weight gauges, queue panel, 3-bay rationale engine, weight verify modal, and hazard confirmation modal. | Interactive UI deck & recommendation testing. |
| **`feat/step-4-driver-queue`** | Built Driver Self Check-In (`/driver`) with ticket card generation, dynamic queue ranking (`queueSorting.js`), and Public Terminal Board (`/queue`). | Dynamic queue position calculation verified. |
| **`feat/step-5-6-7-release`** | Connected Firestore real-time listeners (`lib/sync.js`, `lib/queue.js`), multi-tab offline persistence (`lib/offline.js`), Cast Off guard, multi-master session lock (`MultiMasterGuard.js`), and full documentation. | Offline mode & multi-master view-only guard verified. |
| **`feat/step-8-firestore-wiring`** | Replaced all local `useState(INITIAL_MOCK_QUEUE)` with live Firestore `onSnapshot` listeners across all 3 pages. All mutations (assign, unload, verify, hazard, no-show, cast off, check-in) write to Firestore. Pages now share real-time state. | Real-time cross-tab sync verified on `/master`, `/queue`, `/driver`. |
| **`feat/step-9-numberplate-smartload`** | Replaced random check-in codes with structured Indian vehicle registration number input (state + RTO + series + number, e.g. `KA 01 AB 1234`). Added `suggestOptimalNextLoad()` to safety engine — computes the single best vehicle+bay combo across all waiting vehicles to minimise imbalance. Displayed as a one-click smart banner on `/master`. | Build clean. Smart suggestion verified against seeded queue. |
| **UI Fix Commits (on `main`)** | Restructured bay vehicle cards and queue panel cards to strict vertical centred layout (`flex-col items-center`). Fixed weight+declared stacking, `whitespace-nowrap` on buttons, full number plate display in `font-mono` without truncation. Applied uniformly across `FerryDeck.js`, `QueuePanel.js`, and `RecommendationPanel.js`. | Visual layout verified in browser at `/master`. |

### How to Inspect Branch History Locally

You can inspect the branch structure and commit history using standard Git commands:

```bash
# List all local and remote branches
git branch -a

# View graph visualization of commit progression
git log --graph --oneline --all

# Checkout any specific feature branch to inspect historical state
git checkout feat/step-2-safety-engine
```

---

## 🏗️ Technical Stack

- **Framework**: Next.js 14 (App Router) + React
- **Language**: JavaScript (ES6+, ES Modules) — *No TypeScript*
- **Styling**: Tailwind CSS + Lucide Icons
- **Database & Sync**: Firebase Firestore (`@firebase/firestore`)
- **Persistence**: Firestore Multi-Tab Offline Persistence
- **Living Documentation**: `flow.md` (Operational flows) and `decisions.md` (Technical decisions)

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Automated Safety Engine Tests
```bash
npm run test:safety
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

- **Ferry Master Dashboard**: `http://localhost:3000/master`
- **Driver Check-In**: `http://localhost:3000/driver`
- **Public Queue Board**: `http://localhost:3000/queue`

### 4. Build Production Bundle
```bash
npm run build
```

---

## 🔥 Firebase Setup

The app ships with **built-in demo credentials** so it works out of the box — no Firebase account needed to run locally.

### Demo Mode (Default — No Setup Required)
Data is stored in **browser IndexedDB** via Firestore offline persistence. All three pages (`/master`, `/driver`, `/queue`) sync in real time across tabs in the same browser.

> **Ad Blocker Note**: If you have an ad blocker (uBlock Origin, AdBlock, etc.), it may block requests to `firestore.googleapis.com`. This causes cosmetic `ERR_BLOCKED_BY_CLIENT` errors in the console but **does not break the app** — offline persistence handles all reads and writes through IndexedDB. To suppress the console noise, whitelist `localhost` in your ad blocker settings.

### Real Firebase Project (Optional — For Cross-Device Sync)
To enable true multi-device real-time sync, create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

Then restart the dev server. The app will automatically pick up your real Firebase project instead of the demo keys.

> **Firestore Rules**: Set your Firestore security rules to allow read/write for local testing:
> ```
> rules_version = '2';
> service cloud.firestore {
>   match /databases/{database}/documents {
>     match /{document=**} {
>       allow read, write: if true;
>     }
>   }
> }
> ```

---

## ⚠️ Hazardous Cargo Policy Note

Hazard compatibility rules in this prototype require explicit ferry master confirmation. Hazard compatibility rules are configurable and should be replaced with actual operator/regulatory rules before production deployment.

---

## 📜 Documentation & Git Workflow

- **`flow.md`**: Detailed operational state transitions, system pipelines, and component architecture.
- **`decisions.md`**: Architectural choices, data schemas, product principles, and safety contracts.
- **Git Strategy**: Clean branch progression (`main` -> `dev` -> `feat/*` -> `dev` -> `main`).
