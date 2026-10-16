const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const NOT_OVERDUE = Object.freeze({ isOverdue: false, daysOverdue: 0 });

/**
 * Parses a date-only string as local midnight. `new Date('YYYY-MM-DD')` parses as UTC,
 * which shifts the calendar day in negative-UTC time zones.
 * @param {string|null|undefined} dateString - Date in YYYY-MM-DD format
 * @returns {Date|null} Local-midnight date, or null if missing or invalid
 */
export function parseLocalDate(dateString) {
  if (typeof dateString !== 'string') return null;

  const match = DATE_ONLY_PATTERN.exec(dateString);
  if (!match) return null;

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, monthIndex, day);

  // Reject values like 2026-02-30 that Date silently rolls over
  if (date.getFullYear() !== year || date.getMonth() !== monthIndex || date.getDate() !== day) {
    return null;
  }

  return date;
}

/**
 * Determines whether a todo is overdue relative to the local calendar date.
 * @param {{ dueDate: string|null, completed: number }} todo - Todo to evaluate
 * @param {Date} [today=new Date()] - Reference date; only its calendar day is used
 * @returns {{ isOverdue: boolean, daysOverdue: number }} Overdue status
 */
export function getOverdueStatus(todo, today = new Date()) {
  if (todo.completed === 1) return NOT_OVERDUE;

  const dueDate = parseLocalDate(todo.dueDate);
  if (!dueDate) return NOT_OVERDUE;

  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (dueDate >= todayMidnight) return NOT_OVERDUE;

  // Rounding absorbs the 1-hour shift when the range spans a DST change
  const daysOverdue = Math.round((todayMidnight - dueDate) / MS_PER_DAY);
  return { isOverdue: true, daysOverdue };
}

/**
 * Builds the overdue badge text with correct singular/plural wording.
 * @param {number} daysOverdue - Whole days overdue (>= 1)
 * @returns {string} Label such as "Overdue by 1 day" or "Overdue by 5 days"
 */
export function formatOverdueLabel(daysOverdue) {
  return `Overdue by ${daysOverdue} ${daysOverdue === 1 ? 'day' : 'days'}`;
}
