# Research: Support for Overdue Todo Items

**Feature**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md) | **Date**: 2026-10-16

The spec has no remaining `[NEEDS CLARIFICATION]` markers (all resolved in the 2026-10-16 clarify
session). This document records the technical decisions the plan depends on.

## R1. Comparing date-only due dates against "today"

- **Decision**: Parse `dueDate` (`YYYY-MM-DD`) as a **local-midnight** date by splitting the string
  and calling `new Date(year, monthIndex, day)`. Normalize "today" to local midnight with
  `new Date(now.getFullYear(), now.getMonth(), now.getDate())`. A todo is overdue when
  `dueDate < todayMidnight`.
- **Rationale**: `new Date('2026-10-15')` is parsed as **UTC** midnight, which in UTC-negative time
  zones lands on the previous local day. That would mark items overdue a day early, and the
  existing `formatDate` in `TodoCard.js` already has this bug. Local parsing matches the spec's
  "user's local calendar date" rule (FR-001, Edge Cases → Time zone).
- **Alternatives considered**:
  - String comparison against a locally formatted `YYYY-MM-DD` today string: correct, but it
    doesn't give the day difference needed for FR-007.
  - A date library (date-fns, dayjs): rejected; it is a new dependency for two small functions
    (constitution Principle IV and the Tech Constraints).

## R2. Counting days overdue

- **Decision**: `daysOverdue = Math.round((todayMidnight - dueMidnight) / 86_400_000)`.
- **Rationale**: Both values are local midnights, so the difference is a whole number of days
  except across a DST change (±1 hour). `Math.round` absorbs that hour. `Math.floor` would
  under-count by one on spring-forward days.
- **Alternatives considered**: UTC-based `Date.UTC(y, m, d)` differences are equally correct but
  need a second parse path. Rejected for simplicity.

## R3. Accessible colors in both themes (WCAG AA)

Measured contrast ratios (AA requires 4.5:1 for normal text and 3:1 for non-text UI such as
borders):

| Pair | Ratio | Result |
|---|---|---|
| Light: `--danger-color` `#c62828` text on surface `#ffffff` | 5.62 | ✅ |
| Light: white text on `#c62828` badge | 5.62 | ✅ |
| Dark: `--danger-color` `#ef5350` text on surface `#2d2d2d` | 3.95 | ❌ for 12px text |
| Dark: white text on `#ef5350` badge | 3.49 | ❌ |
| Dark: `#1a1a1a` text on `#ef5350` badge | 4.99 | ✅ |
| Dark: `#ff8a80` text on surface `#2d2d2d` | 6.03 | ✅ |
| Dark: `#ef5350` border on `#2d2d2d` (non-text) | 3.95 | ✅ (≥3:1) |

- **Decision**: Add two theme tokens to `packages/frontend/src/styles/theme.css`:
  - `--danger-text-color`: light `#c62828` (same as danger), dark `#ff8a80`
  - `--on-danger-color`: light `#ffffff`, dark `#1a1a1a`

  The left border uses `--danger-color`. Due-date text uses `--danger-text-color`. The badge uses
  `--danger-color` as its background and `--on-danger-color` as its text.
- **Rationale**: This meets FR-008 and SC-004 in both themes while staying inside the design-token
  system (Principle III forbids hard-coded colors in components; tokens live in `theme.css`).
- **Alternatives considered**:
  - Use `--danger-color` everywhere: fails AA in dark mode.
  - Change the dark `--danger-color` itself: would alter existing delete-button styling, which is
    outside this feature's scope.

## R4. When overdue status is recalculated

- **Decision**: Compute during `TodoCard` render with no memoization, state, or timer.
- **Rationale**: `App` replaces the todo object in state after toggle or edit and refetches on
  load, so `TodoCard` re-renders and recalculates. This satisfies FR-005, FR-006 and
  Clarification Q5 at negligible cost (a few date operations per card).
- **Alternatives considered**:
  - A midnight `setTimeout`: explicitly rejected in Clarification Q5.
  - Computing in `TodoList` and passing it as a prop: adds coupling for no benefit.

## R5. Testing the date-dependent logic deterministically

- **Decision**:
  - Unit tests call `getOverdueStatus(todo, fixedToday)` with an explicit `today` argument.
  - Component tests pin the clock with `jest.useFakeTimers().setSystemTime(new Date(2026, 9, 16))`
    and restore it with `jest.useRealTimers()` in `afterEach`.
- **Rationale**: Injecting the date keeps the utility pure (Principle II: isolation, no shared
  state). react-scripts 5 ships Jest 27, where "modern" fake timers and `setSystemTime` are the
  default. Existing `TodoCard` tests use the hard-coded date `2025-12-25`, which is now in the past.
  New overdue tests must pin the clock so results don't depend on when the suite runs.
- **Alternatives considered**: Mocking `Date` globally by hand. More brittle than Jest's built-in
  system-time control.

## R6. Screen-reader exposure

- **Decision**: Render the badge as visible text inside the due-date `<p>` (e.g.,
  "Due: October 10, 2026 Overdue by 6 days"). No `aria-hidden`, and no icon-only indicator.
- **Rationale**: Visible text is announced naturally with the card content (FR-003, FR-008). No
  extra ARIA is needed, which follows the KISS principle.
- **Alternatives considered**: `aria-live` announcements were rejected; status is static
  per render and live regions would be noisy for long lists.
