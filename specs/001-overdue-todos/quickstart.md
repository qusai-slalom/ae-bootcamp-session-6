# Quickstart: Validate Overdue Todo Items

**Feature**: [spec.md](spec.md) | **Contract**: [contracts/overdue-ui.md](contracts/overdue-ui.md)

## Prerequisites

- Node.js v16+, npm v7+
- From the repo root: `npm install`

## 1. Automated tests

```bash
npm test --workspace=packages/frontend
npm test --workspace=packages/backend   # unchanged; should still pass
```

**Expected**:

- `src/utils/__tests__/overdue.test.js` passes every case in the contract tables (overdue, due
  today, future, no date, completed, invalid date, singular/plural label, time-of-day independence).
- `src/components/__tests__/TodoCard.test.js` passes the new overdue display tests and all
  existing tests.
- The coverage report shows `src/utils/overdue.js` at 100% and overall frontend coverage ≥ 80%.

## 2. Manual check

1. Start the app: `npm run start` (frontend on :3000, backend on :3030).
2. Create these todos, using dates relative to today:

   | Title | Due date | Expected |
   |---|---|---|
   | Past A | yesterday | Red left border, red date, badge "Overdue by 1 day" |
   | Past B | 5 days ago | Badge "Overdue by 5 days" |
   | Today | today | Normal card, no badge |
   | Future | tomorrow | Normal card, no badge |
   | No date | (empty) | Normal card, no badge |

3. Check "Past A" → its badge and border disappear immediately. Uncheck it → they come back.
4. Edit "Past B" and set its due date to tomorrow, then save → the indicator disappears. Edit it
   back to a past date → the indicator reappears.
5. Toggle dark mode → the badge and date text stay clearly legible (see research.md R3 for
   contrast values).
6. Confirm the list order is still newest-first and nothing has moved.
7. With a screen reader or the accessibility inspector, confirm that each overdue card's
   due-date line includes the "Overdue by N days" text.
