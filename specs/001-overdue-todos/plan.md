# Implementation Plan: Support for Overdue Todo Items

**Branch**: `001-overdue-todos` | **Date**: 2026-10-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-overdue-todos/spec.md`

## Summary

Highlight incomplete todos whose due date is before the user's local calendar date. A todo is
overdue when `completed !== 1`, it has a valid `dueDate`, and that date is strictly earlier than
today. Overdue cards get a danger-colored left border, danger-colored due-date text, and an
"Overdue by N day(s)" badge next to the due date.

The approach is **frontend-only and derived at render time**:

- A new pure utility, `packages/frontend/src/utils/overdue.js`, computes overdue status and days
  overdue from a todo and an injectable "today" date.
- `TodoCard` calls the utility on every render, so status updates immediately after toggle, edit,
  or reload with no timer, state, or backend change (spec FR-005, FR-006; Clarification Q5).
- Styling uses existing design tokens plus two new accessibility tokens in `theme.css`, so both
  themes meet WCAG AA (see [research.md](research.md) R3).

## Technical Context

**Language/Version**: JavaScript (ES2020+), Node.js v16+, React 18.2

**Primary Dependencies**: React 18, react-scripts 5.0.1 (CRA); no new dependencies

**Storage**: N/A for this feature. Existing SQLite (`better-sqlite3`) backend stores `dueDate` as
`YYYY-MM-DD` text; no schema or API changes.

**Testing**: Jest (via react-scripts) + React Testing Library 14 + jest-dom for the frontend;
`jest.useFakeTimers().setSystemTime()` to pin "today" in component tests.

**Target Platform**: Modern desktop browsers (CRA browserslist)

**Project Type**: Web application (npm workspaces monorepo: `packages/frontend`, `packages/backend`)

**Performance Goals**: Overdue calculation is O(1) per todo; indicator reflects state changes
within one render (well under the spec's 1-second target, SC-003).

**Constraints**: Calendar-day comparison in the user's local time zone; no timers; WCAG AA
contrast in light and dark themes; no ordering changes.

**Scale/Scope**: Single-user list (tens to low hundreds of todos); 1 new utility module,
1 component change, CSS additions, 2 test files.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Pre-design | Post-design |
|---|---|---|---|
| I. Code Quality & Consistency | `camelCase` utility, `PascalCase` component, import order, single responsibility (date logic lives outside `TodoCard`), JSDoc on public utility functions, no `console.log` | ✅ | ✅ `utils/overdue.js` with JSDoc; `TodoCard` only renders |
| II. Test-First Quality (NON-NEGOTIABLE) | Tests written first; colocated `__tests__/`; AAA; 100% coverage of overdue rules; ≥80% overall | ✅ | ✅ `utils/__tests__/overdue.test.js` + extended `TodoCard.test.js` (see [quickstart.md](quickstart.md)) |
| III. Consistent, Accessible UI | Design tokens only; WCAG AA in both themes; not color-only; screen-reader perceivable | ✅ | ✅ Badge text + 2 new tokens in `theme.css` fix dark-mode contrast (R3) |
| IV. Simplicity & Scope Discipline | No out-of-scope features (no sorting, filtering, reminders, due-soon); KISS | ✅ | ✅ Derived value only; no state, timers, or backend changes |
| V. Robust Error Handling & Validated Boundaries | Invalid dates must not crash rendering | ✅ | ✅ Utility returns "not overdue" for unparsable dates (FR-009) |
| Tech constraints | No new runtime dependencies; existing monorepo structure | ✅ | ✅ No new packages |

**Result**: PASS. No violations, so Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-overdue-todos/
├── plan.md              # This file
├── research.md          # Phase 0: decisions on date math, testing, contrast
├── data-model.md        # Phase 1: Todo (existing) + derived OverdueStatus
├── quickstart.md        # Phase 1: validation guide
├── contracts/
│   └── overdue-ui.md    # Phase 1: utility API + TodoCard rendering contract
├── checklists/
│   └── requirements.md  # From /speckit-specify
└── tasks.md             # Phase 2 output (/speckit-tasks; not created here)
```

### Source Code (repository root)

```text
packages/frontend/src/
├── utils/                          # NEW directory (per coding-guidelines File Organization)
│   ├── overdue.js                  # NEW: parseLocalDate, getOverdueStatus, formatOverdueLabel
│   └── __tests__/
│       └── overdue.test.js         # NEW: unit tests for all overdue rules and edge cases
├── components/
│   ├── TodoCard.js                 # MODIFIED: apply overdue class, badge, aria text
│   ├── TodoList.js                 # UNCHANGED (ordering preserved, FR-010)
│   └── __tests__/
│       └── TodoCard.test.js        # MODIFIED: overdue display tests with pinned system time
├── styles/
│   └── theme.css                   # MODIFIED: add --danger-text-color, --on-danger-color
└── App.css                         # MODIFIED: .todo-card.overdue, .overdue-badge styles

packages/backend/                   # UNCHANGED
```

**Structure Decision**: Use the existing web-application layout. All work is in
`packages/frontend/src`. A new `utils/` folder holds the pure overdue logic, matching the
`utils/` location in `docs/coding-guidelines.md`, so it can be unit-tested in isolation and
reused. The backend is untouched because overdue status is derived, not stored (spec Key
Entities; [data-model.md](data-model.md)).

## Implementation Approach

1. **Tests first (Principle II)**: write `utils/__tests__/overdue.test.js` covering every rule in
   [contracts/overdue-ui.md](contracts/overdue-ui.md), then the new `TodoCard` display tests. Both
   should fail initially.
2. **Utility**: implement `utils/overdue.js` with these functions:
   - `parseLocalDate(dateString)` → local-midnight `Date` or `null`
   - `getOverdueStatus(todo, today = new Date())` → `{ isOverdue, daysOverdue }`
   - `formatOverdueLabel(daysOverdue)` → `"Overdue by 1 day"` / `"Overdue by N days"`
3. **Component**: in `TodoCard.js`, call `getOverdueStatus(todo)` during render, then:
   - add the `overdue` class to the card root
   - add the `overdue` class to `.todo-due-date`
   - render `<span className="overdue-badge">` with the label inside the due-date line, so screen
     readers announce it with the date
4. **Styles**: add the tokens to `theme.css` and these rules to `App.css`:
   - `.todo-card.overdue { border-left: 4px solid var(--danger-color); }`
   - `.todo-due-date.overdue { color: var(--danger-text-color); }`
   - `.overdue-badge` using `--danger-color` / `--on-danger-color`, caption typography, and
     `--radius-sm`, with `--space-xs` spacing
5. **Date display fix (in scope; it affects FR-001 consistency)**: `TodoCard.formatDate` currently
   uses `new Date('YYYY-MM-DD')`, which parses as UTC and can show the previous day in negative-UTC
   time zones. Switch it to `parseLocalDate`, so the displayed date and the overdue calculation
   agree (R1).
6. **Verify**: run `npm test` and check coverage, then do the manual checks in
   [quickstart.md](quickstart.md).

## Complexity Tracking

No constitution violations; nothing to justify.
