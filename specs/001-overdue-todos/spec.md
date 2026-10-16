# Feature Specification: Support for Overdue Todo Items

**Feature Branch**: `001-overdue-todos`

**Created**: 2026-10-16

**Status**: Draft

**Input**: User description: "Support for Overdue Todo Items. As a todo application user I want to
easily identify and distinguish overdue tasks in my todo list so that I can prioritize my work and
quickly see which tasks are past their due date. Users need a clear, visual way to identify which
todos have not been completed by their due date. This helps users quickly spot overdue items without
having to manually check dates against today's date. This feature must include automated tests
covering the overdue determination logic and its display, following the existing Jest patterns in
the repository."

## Clarifications

### Session 2026-10-16

- Q: What should the overdue indicator look like on a todo card? → A: Danger-colored left
  border on the card, an "Overdue" badge next to the due date, and the due date text in the
  danger color.
- Q: Should todos that are due today (not yet overdue) get any special marker? → A: No; due-today
  todos look the same as any other non-overdue todo.
- Q: Should overdue todos change position in the list? → A: No; keep the existing newest-first
  order and only restyle overdue todos.
- Q: Is showing the number of days overdue required for this release? → A: Yes; the badge text
  reads "Overdue by N day(s)" (MUST).
- Q: If the app is left open past midnight, when should todos due yesterday become overdue? → A:
  On the next page load or list re-render (e.g., after an add, edit, or toggle); no timer.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Spot overdue todos at a glance (Priority: P1)

As a user viewing my todo list, I can immediately see which incomplete todos are past their due
date because they are visually distinguished from other todos and clearly labeled as overdue,
without having to compare each due date to today's date myself.

**Why this priority**: This is the core value of the feature. Without a visible overdue indicator,
the user must manually scan and compare dates, which is exactly the problem being solved.

**Independent Test**: Load a list containing a mix of todos (past due and incomplete, due today,
due in the future, no due date, past due but completed) and confirm that only the past-due,
incomplete todos display the overdue indicator.

**Acceptance Scenarios**:

1. **Given** an incomplete todo whose due date is before today, **When** the user views the todo
   list, **Then** that todo is displayed with a distinct overdue visual treatment and a visible
   overdue badge (e.g., "Overdue by 3 days").
2. **Given** an incomplete todo whose due date is today, **When** the user views the todo list,
   **Then** that todo is NOT marked as overdue.
3. **Given** an incomplete todo whose due date is in the future, **When** the user views the todo
   list, **Then** that todo is NOT marked as overdue.
4. **Given** a todo with no due date, **When** the user views the todo list, **Then** that todo is
   NOT marked as overdue.
5. **Given** a completed todo whose due date is before today, **When** the user views the todo
   list, **Then** that todo is NOT marked as overdue and retains its normal completed appearance.

---

### User Story 2 - Overdue status stays accurate as todos change (Priority: P2)

As a user, when I complete, reopen, or reschedule a todo, its overdue indicator updates right away
so the list always reflects the todo's current state.

**Why this priority**: An indicator that lags behind user actions would be misleading and erode
trust. It builds directly on Story 1 but is not required for a first usable slice.

**Independent Test**: Starting from an overdue todo, mark it complete, reopen it, and change its due
date to a future date and back to a past date, confirming the indicator appears and disappears
correctly after each action without reloading the page.

**Acceptance Scenarios**:

1. **Given** an overdue todo, **When** the user marks it complete, **Then** the overdue indicator
   is removed immediately.
2. **Given** a completed todo with a past due date, **When** the user marks it incomplete, **Then**
   the overdue indicator appears immediately.
3. **Given** an overdue todo, **When** the user edits its due date to today or a future date,
   **Then** the overdue indicator is removed once the edit is saved.
4. **Given** a non-overdue incomplete todo, **When** the user edits its due date to a past date,
   **Then** the overdue indicator appears once the edit is saved.
5. **Given** an overdue todo, **When** the user removes its due date, **Then** the overdue
   indicator is removed once the edit is saved.

---

### User Story 3 - Understand how overdue a todo is (Priority: P3)

As a user, I can see how many days a todo is overdue so I can decide which overdue item to tackle
first.

**Why this priority**: Required for this release. It helps prioritize among several overdue items
and is built on top of the overdue determination from Story 1, so it is sequenced last.

**Independent Test**: Create incomplete todos due 1 day ago and 5 days ago and confirm each shows
the correct number of days overdue with correct singular/plural wording.

**Acceptance Scenarios**:

1. **Given** an incomplete todo due yesterday, **When** the user views the list, **Then** the
   overdue badge reads "Overdue by 1 day".
2. **Given** an incomplete todo due 5 days ago, **When** the user views the list, **Then** the
   overdue badge reads "Overdue by 5 days".

---

### Edge Cases

- **Due today**: A todo due today is not overdue and receives no special "due today" or "due soon"
  treatment; it becomes overdue only once the calendar day after its due date begins.
- **No due date**: Todos without a due date are never overdue.
- **Completed items**: Completed todos are never shown as overdue, regardless of their due date.
- **Day rollover while the app is open**: Overdue status is recalculated against the current
  local date on every page load and every list re-render (e.g., after an add, edit, or toggle).
  No timer or scheduled midnight refresh is used, so a todo due yesterday may appear non-overdue
  until the next load or re-render.
- **Time zone**: "Today" is determined by the user's local calendar date on their device, not by
  server time or UTC.
- **Malformed or missing date value**: If a todo's due date cannot be interpreted as a valid date,
  the todo is treated as not overdue and the list continues to display normally.
- **Many overdue items**: When many todos are overdue, each one is individually marked; the list
  does not collapse, hide, or reorder items.
- **Theme switching**: The overdue indicator remains clearly visible and legible in both light and
  dark modes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST classify a todo as overdue if and only if the todo is incomplete, has a
  due date, and that due date is strictly earlier than the user's current local calendar date.
- **FR-002**: System MUST visually distinguish each overdue todo card with a left border in the
  design system's danger color and render its due date text in the danger color.
- **FR-003**: System MUST display an overdue text badge next to the due date on each overdue todo
  so the status is not communicated by color alone.
- **FR-004**: System MUST NOT mark todos as overdue when they are completed, have no due date, or
  are due today or later.
- **FR-005**: System MUST re-evaluate and update a todo's overdue status immediately after the user
  toggles its completion status or saves a change to its due date.
- **FR-006**: System MUST re-evaluate overdue status against the current local date on every page
  load and every re-render of the todo list; no background timer or scheduled refresh is required.
- **FR-007**: The overdue badge text MUST state the number of whole calendar days the todo is
  overdue, with correct singular/plural wording ("Overdue by 1 day", "Overdue by N days").
- **FR-008**: The overdue indicator MUST be perceivable by assistive technology (e.g., announced by
  screen readers as part of the todo item) and MUST meet WCAG AA color contrast in both light and
  dark modes.
- **FR-009**: System MUST treat a todo with an invalid or unreadable due date as not overdue without
  causing an error or preventing the list from rendering.
- **FR-010**: The feature MUST NOT change the existing todo ordering (newest first), creation,
  editing, or deletion behavior.
- **FR-011**: The feature MUST include automated tests, consistent with the project's existing test
  suite, that cover (a) the overdue determination rules, including all edge cases listed above,
  and (b) the display of the overdue indicator and badge for overdue and non-overdue todos.

### Key Entities

- **Todo** (existing): A task with a title, an optional due date (calendar date, no time of day), a
  completion status, and a creation timestamp. No new stored attributes are required.
- **Overdue status** (derived): A computed, non-persisted property of a todo, determined from its
  completion status, its due date, and the user's current local date. Includes the number of days
  overdue when applicable.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can identify every overdue todo in a list of 20 todos within 5 seconds, without
  reading individual due dates.
- **SC-002**: 100% of todos meeting the overdue definition display the overdue indicator, and 0% of
  todos outside the definition (completed, no due date, due today or later) display it.
- **SC-003**: After completing, reopening, or rescheduling a todo, the overdue indicator reflects
  the new state within 1 second, without a manual page reload.
- **SC-004**: The overdue indicator is distinguishable without relying on color (verified by the
  presence of the overdue badge text) and meets WCAG AA contrast in both themes.
- **SC-005**: Automated tests cover 100% of the overdue determination rules and edge cases, and
  overall project coverage remains at or above 80%.

## Assumptions

- "Overdue" is evaluated at calendar-day granularity because due dates have no time component; a
  todo due today is not overdue until the following day.
- The user's device local date defines "today"; the app is single-user, so no per-user time zone
  setting is needed.
- Overdue status is derived on display and is not stored; no changes to stored todo data are
  required.
- Overdue todos keep their current position in the list; sorting or filtering by overdue status is
  out of scope (filtering is excluded by the functional requirements).
- Reminders, notifications, badges/counts outside the list, and "due today" / "due soon" states are
  out of scope.
- The visual treatment uses the existing design system's danger color and Halloween-themed styling
  (e.g., an optional spooky icon) consistent with the UI guidelines.
