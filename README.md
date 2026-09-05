# 🚢 Rural Ferry Staging & Weight-Balanced Boarding Tool

A real-time, offline-resilient, weight-balanced boarding control surface for rural ferry masters.

---

## 🌟 Key Features

1. **Whole-Deck Primary Control Surface (`/master`)**: A 3-bay visual deck layout (LEFT, CENTER, RIGHT) displaying live weight totals, capacity progress meters, and left/right imbalance spread gauges.
2. **Explainable Rationale Engine (`safety/suggestPlacement.js`)**: Evaluates all 3 deck bays simultaneously and explains *why* a placement is recommended or rejected (e.g., `✓ Fits capacity`, `✓ Keeps left/right spread within 1,000 kg`, `⚠ LEFT worsens balance`, `✕ RIGHT exceeds bay limit`).
3. **Pure JavaScript Safety Engine (`safety/validateDeck.js`)**: Isolated, testable safety module enforcing hard capacity limits, bay thresholds, maximum imbalance bounds (1,000 kg), hazardous cargo confirmation, and weight trust precedence (`verifiedWeight ?? declaredWeight`).
4. **Driver Self Check-In (`/driver`)**: Mobile check-in interface generating unique check-in codes (e.g. `FERRY-7K42`), ticket cards, wait time estimates, and duplicate submission debouncing.
5. **Dynamic Queue Ranking (`utils/queueSorting.js`)**: Emergency vehicles (Ambulance) receive queue priority, but do NOT bypass safety limits. Queue positions update dynamically based on live deck changes.
6. **Public Queue Board (`/queue`)**: Terminal board for public display showing active deck load capacity and departure countdown.
7. **Offline Resilience & Cast Off Protection**: Multi-tab Firestore persistence with real-time `onSnapshot` sync. Cast Off is strictly disabled during offline/stale state.
8. **Multi-Master Lock (`components/master/MultiMasterGuard.js`)**: Restricts secondary master sessions to `VIEW ONLY` mode to prevent conflicting deck operations across devices.

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

## ⚠️ Hazardous Cargo Policy Note

Hazard compatibility rules in this prototype require explicit ferry master confirmation. Hazard compatibility rules are configurable and should be replaced with actual operator/regulatory rules before production deployment.

---

## 📜 Documentation & Git Workflow

- **`flow.md`**: Detailed operational state transitions, system pipelines, and component architecture.
- **`decisions.md`**: Architectural choices, data schemas, product principles, and safety contracts.
- **Git Strategy**: Clean branch progression (`main` -> `dev` -> `feat/*` -> `dev` -> `main`).
