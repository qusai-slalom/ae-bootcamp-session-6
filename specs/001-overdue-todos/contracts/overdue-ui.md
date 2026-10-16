# Contract: Overdue Utility & TodoCard Rendering

**Feature**: [../spec.md](../spec.md) | **Data model**: [../data-model.md](../data-model.md)

There are no HTTP API changes. These are the internal interfaces the tests are written against.

## Module: `packages/frontend/src/utils/overdue.js`

### `parseLocalDate(dateString) → Date | null`

| Input | Output |
|---|---|
| `'2026-10-15'` | `Date` at local midnight, Oct 15 2026 |
| `null`, `undefined`, `''` | `null` |
| `'not-a-date'`, `'2026-13-01'`, `'2026-02-30'` | `null` |

### `getOverdueStatus(todo, today = new Date()) → { isOverdue: boolean, daysOverdue: number }`

With `today = new Date(2026, 9, 16, 15, 30)` (Oct 16 2026, 3:30 pm local):

| `todo.completed` | `todo.dueDate` | Result |
|---|---|---|
| `0` | `'2026-10-15'` | `{ isOverdue: true, daysOverdue: 1 }` |
| `0` | `'2026-10-11'` | `{ isOverdue: true, daysOverdue: 5 }` |
| `0` | `'2026-10-16'` | `{ isOverdue: false, daysOverdue: 0 }` (due today) |
| `0` | `'2026-10-20'` | `{ isOverdue: false, daysOverdue: 0 }` |
| `0` | `null` | `{ isOverdue: false, daysOverdue: 0 }` |
| `1` | `'2026-10-01'` | `{ isOverdue: false, daysOverdue: 0 }` |
| `0` | `'garbage'` | `{ isOverdue: false, daysOverdue: 0 }` |

The time of day in `today` must not affect the result (calendar-day granularity).

### `formatOverdueLabel(daysOverdue) → string`

| Input | Output |
|---|---|
| `1` | `'Overdue by 1 day'` |
| `5` | `'Overdue by 5 days'` |

## Component: `TodoCard` rendering contract

When `getOverdueStatus(todo).isOverdue` is **true**:

- The root element has the classes `todo-card overdue`.
- The `.todo-due-date` element has the class `overdue`.
- An element `.overdue-badge` with text `formatOverdueLabel(daysOverdue)` is rendered inside
  `.todo-due-date`.

When it is **false**:

- There is no `overdue` class on the card or the due date.
- No `.overdue-badge` element is rendered.

Unchanged behavior: the existing checkbox, edit, delete, and edit-mode rendering. While editing,
the edit form is shown and no overdue indicator appears.

## Styling contract (`theme.css`, `App.css`)

| Token / class | Light | Dark |
|---|---|---|
| `--danger-text-color` | `#c62828` | `#ff8a80` |
| `--on-danger-color` | `#ffffff` | `#1a1a1a` |
| `.todo-card.overdue` | `border-left: 4px solid var(--danger-color)` | same |
| `.todo-due-date.overdue` | `color: var(--danger-text-color)` | same |
| `.overdue-badge` | bg `var(--danger-color)`, text `var(--on-danger-color)`, 12px/600, `var(--radius-sm)` | same |
