---

description: "Task list for implementing overdue todo indicators"
---

# Tasks: Support for Overdue Todo Items

**Input**: Design documents from `/specs/001-overdue-todos/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/overdue-ui.md](contracts/overdue-ui.md),
[quickstart.md](quickstart.md)

**Tests**: REQUIRED. Spec FR-011 explicitly requests automated tests, and constitution Principle
II (Test-First, NON-NEGOTIABLE) mandates writing them first. Every test task MUST be written and
seen to FAIL before its matching implementation task.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested
independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- All paths are relative to the repository root

## Path Conventions

- Web app monorepo: all work is in `packages/frontend/src/`; `packages/backend/` is unchanged
- Tests are colocated in `__tests__/` folders and named `{filename}.test.js`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the new folder and the design tokens every story's styling depends on

- [ ] T001 Create directories `packages/frontend/src/utils/` and `packages/frontend/src/utils/__tests__/` per plan.md Project Structure
- [ ] T002 [P] Add `--danger-text-color` (light `#c62828`, dark `#ff8a80`) and `--on-danger-color` (light `#ffffff`, dark `#1a1a1a`) to both the `:root` and `[data-theme="dark"]` blocks in `packages/frontend/src/styles/theme.css` (research.md R3)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Local-time date parsing, which the overdue rule and the date display both rely on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Write failing unit tests for `parseLocalDate` in `packages/frontend/src/utils/__tests__/overdue.test.js`, covering every row of the `parseLocalDate` table in contracts/overdue-ui.md: a valid date → local midnight (assert `getFullYear/getMonth/getDate/getHours`); `null`/`undefined`/`''` → `null`; `'not-a-date'`, `'2026-13-01'`, `'2026-02-30'` → `null`
- [ ] T004 Implement and export `parseLocalDate(dateString)` with JSDoc in `packages/frontend/src/utils/overdue.js`. Match `/^\d{4}-\d{2}-\d{2}$/`, build `new Date(y, m - 1, d)`, and return `null` if the components don't round-trip (rejects `2026-02-30`). Make T003 pass.
- [ ] T005 Replace `new Date(dateString)` with `parseLocalDate(dateString)` inside `formatDate` in `packages/frontend/src/components/TodoCard.js`. This fixes the UTC off-by-one display bug from research.md R1. Confirm the existing tests in `packages/frontend/src/components/__tests__/TodoCard.test.js` still pass.

**Checkpoint**: Foundation ready. Dates are parsed in local time everywhere.

---

## Phase 3: User Story 1 - Spot overdue todos at a glance (Priority: P1) 🎯 MVP

**Goal**: Incomplete todos with a due date before today show a danger left border, danger
due-date text, and an "Overdue" badge. All other todos look unchanged.

**Independent Test**: Render a mix of todos (past-due incomplete, due today, future, no date,
past-due completed) with the clock pinned to 2026-10-16. Only the past-due incomplete todo
shows the indicator.

### Tests for User Story 1 ⚠️ (write first, must FAIL)

- [ ] T006 [P] [US1] Add failing unit tests for `getOverdueStatus(todo, today).isOverdue` in `packages/frontend/src/utils/__tests__/overdue.test.js`, using `today = new Date(2026, 9, 16, 15, 30)`:
  - past date `'2026-10-15'` → `true`
  - today `'2026-10-16'` → `false`
  - future `'2026-10-20'` → `false`
  - `null` due date → `false`
  - `completed: 1` with past date → `false`
  - `'garbage'` → `false`
  - same result for `today` at 00:00 and at 23:59 (time-of-day independence)
  - default `today` argument uses the current date
- [ ] T007 [P] [US1] Add failing component tests in `packages/frontend/src/components/__tests__/TodoCard.test.js`. In a new `describe('overdue indicator')`, call `jest.useFakeTimers().setSystemTime(new Date(2026, 9, 16))` in `beforeEach` and `jest.useRealTimers()` in `afterEach`, then assert:
  - an overdue todo's card root has the class `overdue`
  - `.todo-due-date` has the class `overdue`
  - an `.overdue-badge` element is rendered inside the due-date paragraph
  - todos due today, in the future, with no due date, or completed (past due) have no `overdue` class and no badge
  - edit mode (after clicking Edit) shows no badge

  Note: the existing fixture `dueDate: '2025-12-25'` is now in the past, so keep existing tests' assertions independent of the badge.

### Implementation for User Story 1

- [ ] T008 [US1] Implement and export `getOverdueStatus(todo, today = new Date())` with JSDoc in `packages/frontend/src/utils/overdue.js`:
  - normalize `today` to local midnight
  - return `{ isOverdue: false, daysOverdue: 0 }` when `todo.completed === 1`, the due date is missing, or the due date is invalid (FR-004, FR-009)
  - otherwise set `isOverdue = dueMidnight < todayMidnight` and compute `daysOverdue` with `Math.round((todayMidnight - dueMidnight) / 86400000)` (research.md R2)

  Depends on T004. Makes T006 pass.
- [ ] T009 [US1] In `packages/frontend/src/components/TodoCard.js`, import `getOverdueStatus` and call it during render. Do not use `useState`/`useMemo` (research.md R4). Then:
  - append `overdue` to the root `todo-card` className
  - append `overdue` to the `todo-due-date` className
  - render `<span className="overdue-badge">Overdue</span>` inside the `.todo-due-date` `<p>` after the date

  Follow the import order: React → internal modules. Depends on T008. Makes T007 pass.
- [ ] T010 [P] [US1] Add styles in `packages/frontend/src/App.css` after `.todo-due-date`:
  - `.todo-card.overdue { border-left: 4px solid var(--danger-color); }`
  - `.todo-due-date.overdue { color: var(--danger-text-color); }`
  - `.overdue-badge`: `display: inline-block`, `margin-left: var(--space-xs)`, `padding: 2px var(--space-xs)`, `background-color: var(--danger-color)`, `color: var(--on-danger-color)`, `font-size: 12px`, `font-weight: 600`, `border-radius: var(--radius-sm)`

  Use tokens only (Principle III). Depends on T002.

**Checkpoint**: User Story 1 is fully functional. Overdue todos are visibly and textually marked in both themes.

---

## Phase 4: User Story 2 - Overdue status stays accurate as todos change (Priority: P2)

**Goal**: The indicator appears or disappears immediately after toggling completion or saving a
due-date edit, with no page reload.

**Independent Test**: Starting from an overdue todo, toggle complete and incomplete, and edit
the due date to a future date, to none, and back to a past date. The indicator follows each
change.

### Tests for User Story 2 ⚠️ (write first, must FAIL or prove behavior)

- [ ] T011 [P] [US2] Add prop-change tests in `packages/frontend/src/components/__tests__/TodoCard.test.js` that use RTL `rerender` with the clock pinned to 2026-10-16:
  - overdue → `completed: 1` removes the badge and class
  - `completed: 1` → `completed: 0` with a past date adds them
  - past → future `dueDate` removes them
  - past → `null` `dueDate` removes them
  - future → past `dueDate` adds them
- [ ] T012 [P] [US2] Add integration tests in `packages/frontend/src/__tests__/App.test.js`, using the existing msw `server`:
  - Override handlers with `server.use(rest.get('/api/todos', ...), rest.patch('/api/todos/:id/toggle', ...), rest.put('/api/todos/:id', ...))` to serve an overdue todo.
  - Build relative dates from the real clock (e.g., a local `YYYY-MM-DD` 3 days ago and 3 days ahead). Do NOT use Jest fake timers here: Jest 27 fake timers can stall msw responses, and `doNotFake` requires Jest 28+.
  - Assert the `.overdue-badge` disappears after clicking the checkbox, and after editing the due date to the future and saving.
  - Assert the list order is unchanged (FR-010).

### Implementation for User Story 2

- [ ] T013 [US2] Verify in `packages/frontend/src/components/TodoCard.js` that overdue status is derived only from current props on each render, with no cached state or memo. If T011 or T012 fail, fix the component so the status follows `todo.completed`/`todo.dueDate` changes. Do not add timers (Clarification Q5).

**Checkpoint**: User Stories 1 and 2 both work. The indicator stays in sync with user actions.

---

## Phase 5: User Story 3 - Understand how overdue a todo is (Priority: P3)

**Goal**: The badge text reads "Overdue by 1 day" or "Overdue by N days".

**Independent Test**: Incomplete todos due 1 day and 5 days before the pinned date show
"Overdue by 1 day" and "Overdue by 5 days".

### Tests for User Story 3 ⚠️ (write first, must FAIL)

- [ ] T014 [P] [US3] Add failing unit tests in `packages/frontend/src/utils/__tests__/overdue.test.js`:
  - `getOverdueStatus(...).daysOverdue` is `1` for `'2026-10-15'` and `5` for `'2026-10-11'` when today is 2026-10-16, and `0` when not overdue
  - a DST-spanning case (`'2026-03-07'` vs `new Date(2026, 2, 9)`) gives `2`
  - `formatOverdueLabel(1)` → `'Overdue by 1 day'` and `formatOverdueLabel(5)` → `'Overdue by 5 days'`
- [ ] T015 [P] [US3] Add failing component tests in `packages/frontend/src/components/__tests__/TodoCard.test.js` with the clock pinned to 2026-10-16: the `.overdue-badge` text is `'Overdue by 1 day'` for due `'2026-10-15'` and `'Overdue by 5 days'` for due `'2026-10-11'`

### Implementation for User Story 3

- [ ] T016 [US3] Implement and export `formatOverdueLabel(daysOverdue)` with JSDoc in `packages/frontend/src/utils/overdue.js` (singular for 1, plural otherwise). Confirm `daysOverdue` from T008 satisfies T014.
- [ ] T017 [US3] In `packages/frontend/src/components/TodoCard.js`, replace the static `Overdue` badge text with `formatOverdueLabel(daysOverdue)`. Depends on T016. Makes T015 pass.

**Checkpoint**: All user stories are complete. The badge shows the exact days-overdue count.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, quality gates, and end-to-end validation

- [ ] T018 [P] Update `docs/ui-guidelines.md`:
  - add `--danger-text-color` and `--on-danger-color` to the Light and Dark palettes
  - add an "Overdue State" subsection under Todo Item Card (left border, danger date text, badge "Overdue by N day(s)")

  The constitution's governance rule requires docs to stay aligned.
- [ ] T019 [P] Update `docs/functional-requirements.md`: add "1.6 Overdue Indicator" under Core Features summarizing the overdue rule (incomplete, has a due date, due date before today in local time), the badge text, no reordering, and recalculation on load or re-render; add a matching Success Criteria checkbox
- [ ] T020 Review `packages/frontend/src/utils/overdue.js` and `packages/frontend/src/components/TodoCard.js`: no `console.log` added, JSDoc on every export, import order, and 2-space indentation (Principle I)
- [ ] T021 Run `npm test --workspace=packages/frontend` and confirm all tests pass, `src/utils/overdue.js` has 100% coverage, and overall frontend coverage is ≥ 80% (SC-005)
- [ ] T022 Run `npm test --workspace=packages/backend` and confirm it is unchanged and passing
- [ ] T023 Run the manual validation steps in `specs/001-overdue-todos/quickstart.md`: light and dark themes, toggle and edit flows, unchanged ordering, and screen-reader text

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on T001. BLOCKS all user stories.
- **US1 (Phase 3)**: Depends on Phase 2. T010 also depends on T002.
- **US2 (Phase 4)**: Depends on US1 (it tests the US1 indicator reacting to changes)
- **US3 (Phase 5)**: Depends on US1 (it changes the US1 badge text). Independent of US2.
- **Polish (Phase 6)**: Depends on all user stories

### User Story Dependencies

```text
Setup (T001–T002) ─▶ Foundational (T003–T005) ─▶ US1 (T006–T010) ─┬─▶ US2 (T011–T013) ─┐
                                                                    └─▶ US3 (T014–T017) ─┴─▶ Polish (T018–T023)
```

### Within Each User Story

- Tests are written first and must FAIL before implementation (Principle II)
- Utility (`overdue.js`) before component (`TodoCard.js`)
- Styles (`App.css`) can be done in parallel with logic because they are in a different file

### Parallel Opportunities

- T002 can run alongside T001, since they touch different files
- US1: T006 (`overdue.test.js`) ∥ T007 (`TodoCard.test.js`); then T010 (`App.css`) ∥ T008 → T009
- US2: T011 (`TodoCard.test.js`) ∥ T012 (`App.test.js`)
- US2 and US3 can proceed in parallel after US1, but both edit `TodoCard.test.js`/`TodoCard.js`, so coordinate if two people do this
- US3: T014 (`overdue.test.js`) ∥ T015 (`TodoCard.test.js`)
- Polish: T018 ∥ T019 (different docs)

---

## Parallel Example: User Story 1

```bash
# Write both US1 test sets together (different files):
Task: "T006 Unit tests for getOverdueStatus.isOverdue in packages/frontend/src/utils/__tests__/overdue.test.js"
Task: "T007 Component tests for overdue indicator in packages/frontend/src/components/__tests__/TodoCard.test.js"

# Styles alongside logic:
Task: "T010 Overdue styles in packages/frontend/src/App.css"
Task: "T008 getOverdueStatus in packages/frontend/src/utils/overdue.js"
```

## Parallel Example: User Story 3

```bash
Task: "T014 daysOverdue + formatOverdueLabel unit tests in packages/frontend/src/utils/__tests__/overdue.test.js"
Task: "T015 Badge text component tests in packages/frontend/src/components/__tests__/TodoCard.test.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup) and Phase 2 (Foundational)
2. Complete Phase 3 (US1). Overdue todos are now marked with an "Overdue" badge.
3. **STOP and VALIDATE**: run `npm test --workspace=packages/frontend` and do quickstart steps 1–2 and 5
4. Demo if ready

### Incremental Delivery

1. Setup + Foundational → local-date parsing (also fixes the date display bug)
2. US1 → overdue indicator (MVP)
3. US2 → proves the indicator tracks toggle and edit changes
4. US3 → "Overdue by N day(s)" badge text (required by Clarification Q4 before release)
5. Polish → docs, quality gates, full quickstart

---

## Notes

- [P] tasks touch different files and have no incomplete dependencies
- The [Story] label maps each task to a spec user story for traceability
- Pin the clock (or pass an explicit `today`) in every date-dependent unit and component test; in msw-backed App tests, use dates relative to the real clock instead (see T012)
- Commit after each task or logical group
- Avoid: sorting or filtering overdue items, "due soon" states, timers, and backend changes (all out of scope per spec)
