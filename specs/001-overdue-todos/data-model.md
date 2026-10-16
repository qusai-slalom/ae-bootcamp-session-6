# Data Model: Support for Overdue Todo Items

**Feature**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

No persisted data changes. The backend schema (`todos` table in
`packages/backend/src/app.js`) and the REST API are unchanged.

## Todo (existing, unchanged)

| Field | Type (as received by frontend) | Notes |
|---|---|---|
| `id` | number | Primary key |
| `title` | string | Required, ≤ 255 chars |
| `dueDate` | `string \| null` | Calendar date `YYYY-MM-DD`, no time component; optional |
| `completed` | `0 \| 1` | SQLite integer boolean; `1` = complete |
| `createdAt` | string (ISO timestamp) | Used for newest-first ordering |

## OverdueStatus (new, derived, not persisted)

Computed by `getOverdueStatus(todo, today)` in `packages/frontend/src/utils/overdue.js`.

| Field | Type | Rule |
|---|---|---|
| `isOverdue` | boolean | `true` if and only if `completed !== 1`, `dueDate` parses to a valid local date, and that date is strictly before `today`'s local calendar date (FR-001) |
| `daysOverdue` | number | Whole calendar days between the due date and today when `isOverdue` is true (≥ 1); otherwise `0` (FR-007) |

### Validation rules

- `dueDate` is `null`, `undefined`, or `''` → `{ isOverdue: false, daysOverdue: 0 }`
- `dueDate` doesn't match `YYYY-MM-DD` or isn't a real date (e.g., `2026-02-30`) →
  `{ isOverdue: false, daysOverdue: 0 }` (FR-009)
- `completed === 1` → `{ isOverdue: false, daysOverdue: 0 }` regardless of date (FR-004)
- `dueDate` equals today → not overdue (Clarification Q2)

### State transitions

```text
                 date passes midnight (seen on next load/re-render)
  NOT_OVERDUE ─────────────────────────────────────────────────▶ OVERDUE
       ▲   ▲                                                      │  │
       │   └──────────── due date edited to today/future/none ────┘  │
       └──────────────── marked complete ────────────────────────────┘

  OVERDUE ◀── marked incomplete (past due date) ── NOT_OVERDUE (completed)
  OVERDUE ◀── due date edited to a past date ──── NOT_OVERDUE (incomplete)
```

Every transition is a re-render of `TodoCard` with new props or a new current date. No status is
stored.
