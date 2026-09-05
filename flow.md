# The Flow File (`flow.md`) — Rural Ferry Staging & Boarding Tool

This document tracks the operational workflows, system architecture pipelines, state transition maps, and component communication flows across all stages of development.

---

## 1. High-Level Operational Architecture

```text
┌─────────────────────────────────────────────────────────┐
│                     NEXT.JS CLIENT                      │
│                                                         │
│   Driver View          Queue View       Master View     │
│    (/driver)            (/queue)         (/master)      │
│        │                   │                 │          │
│        └───────────────────┼─────────────────┘          │
│                            │                            │
│                  React State / Hooks                    │
│                            │                            │
│           ┌────────────────┴────────────────┐           │
│           │                                 │           │
│     Safety Engine                     Firebase SDK      │
│  (validateDeck.js)                   (onSnapshot)       │
│  (suggestPlacement.js)                      │           │
│           │                           Offline Cache     │
│           │                                 │           │
└───────────┼─────────────────────────────────┼───────────┘
            │                                 │
            │                                 ▼
            │                         FIRESTORE DATABASE
            │                                 │
            └─────────────────────────────────┘
```

---

## 2. Vehicle Lifecycle State Flow

```text
   [ CHECK-IN ]
        │ (Driver submits form at /driver with duplicate submit protection)
        ▼
   [ WAITING ] ───────► [ NO_SHOW ] / [ REJECTED ]
        │ (Ordered dynamically: EMERGENCY -> NORMAL -> createdAt)
        ▼
   [ READY ] ────────► Master selects vehicle & evaluates 3 bays
        │
        ▼
   [ BOARDING ] ──────► Assigned to bay (LEFT, CENTER, RIGHT)
        │
        ▼
   [ LOADED ] ────────► Verified on Deck (Master can verify weight / hazard)
        │
        ▼
   [ COMPLETED ] ─────► Ferry Casts Off (Crossing Completed, Next Run Promoted)
```

---

## 3. Master Control Surface & Guard Flow (`app/master/page.js`)

```text
                        ┌─────────────────────────────────┐
                        │       MultiMasterGuard          │
                        │ (Session Lock & View Only Mode) │
                        └────────────────┬────────────────┘
                                         │
                        ┌────────────────┴────────────────┐
                        │     MasterHeader Component      │
                        │ (Crossing ID, Deck Weight Bar)  │
                        └────────────────┬────────────────┘
                                         │
       ┌─────────────────────────────────┼─────────────────────────────────┐
       ▼                                 ▼                                 ▼
  QueuePanel                         FerryDeck                     RecommendationPanel
 (Waiting Queue &                  (3-Bay Deck Surface:             (Rationale Breakdown:
 Emergency Priority)             LEFT, CENTER, RIGHT)               ✓ Fits capacity,
                                                                    ✓ Reduces imbalance,
                                                                    ⚠ LEFT worsens,
                                                                    ✕ RIGHT exceeds)
                                         │
                                         ▼
                                  CastOffButton
                        (Pre-departure Safety Checklist
                         & Offline Block Guard)
```

---

## 4. Current Implementation Status

- **Step 1: Foundation & Base Structure** — Completed (`package.json`, `lib/constants.js`, `lib/firebase.js`, `lib/mockData.js`, `flow.md`, `decisions.md`, Git branches setup).
- **Step 2: Pure Safety Engine & Test Suite** — Completed (`safety/validateDeck.js`, `safety/suggestPlacement.js`, `safety/__tests__/safetyEngine.test.js` - 15/15 tests passing).
- **Step 3: Master Control Surface (`/master`)** — Completed (`app/master/page.js`, `MasterHeader.js`, `FerryDeck.js`, `QueuePanel.js`, `RecommendationPanel.js`, `WeightVerifyModal.js`, `HazardModal.js`).
- **Step 4: Driver & Queue Views (`/driver`, `/queue`)** — Completed (`app/driver/page.js`, `TicketCard.js`, `app/queue/page.js`, `utils/queueSorting.js`).
- **Step 5: Firestore & Realtime Synchronization** — Completed (`lib/queue.js`, `lib/sync.js`, multi-tab offline persistence enabled).
- **Step 6: Offline Resilience & Multi-Master Guard** — Completed (`lib/offline.js`, `MultiMasterGuard.js`, `CastOffButton.js` offline block & pre-departure checklist).
- **Step 7: Final Release Package** — Completed (`npm run build` passing, main/dev git branches synced).
