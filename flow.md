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
        │ (Driver submits form at /driver)
        ▼
   [ WAITING ] ───────► [ NO_SHOW ] / [ REJECTED ]
        │ (Ordered by Priority: EMERGENCY -> NORMAL -> createdAt)
        ▼
   [ READY ] ────────► Master selects vehicle & evaluates bays
        │
        ▼
   [ BOARDING ] ──────► Assigned to bay (LEFT, CENTER, RIGHT)
        │
        ▼
   [ LOADED ] ────────► Verified on Deck
        │
        ▼
   [ COMPLETED ] ─────► Ferry Casts Off (Crossing Completed)
```

---

## 3. Safety Evaluation Flow

```text
Master selects vehicle from Queue
               │
               ▼
   suggestPlacement(vehicle, currentVehicles, ferryConfig)
               │
   ┌───────────┼───────────┐
   ▼           ▼           ▼
Evaluate    Evaluate    Evaluate
  LEFT       CENTER      RIGHT
   │           │           │
   └───────────┼───────────┘
               ▼
   Filter Valid Bays (reasons: FITS_CAPACITY, IMPROVES_BALANCE)
               ▼
   Score Valid Bays by Minimum Post-Placement Imbalance
               ▼
   Recommend Best Valid Bay & Output Explicit Rationale
```

---

## 4. Current Implementation Status

- **Step 1: Foundation & Base Structure** — Completed (`package.json`, `lib/constants.js`, `lib/firebase.js`, `lib/mockData.js`, `flow.md`, `decisions.md`, Git setup).
- **Step 2: Pure Safety Engine** — Pending execution.
- **Step 3: Master Control Surface** — Pending execution.
- **Step 4: Driver & Queue Views** — Pending execution.
- **Step 5: Firestore & Realtime Listeners** — Pending execution.
- **Step 6: Offline Resilience & Multi-Master Guard** — Pending execution.
- **Step 7: Final Polish & Release** — Pending execution.
