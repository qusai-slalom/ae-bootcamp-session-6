import { formatOverdueLabel, getOverdueStatus, parseLocalDate } from '../overdue';

// Oct 16 2026, 3:30 pm local
const TODAY = new Date(2026, 9, 16, 15, 30);

const buildTodo = (overrides = {}) => ({
  id: 1,
  title: 'Test Todo',
  dueDate: null,
  completed: 0,
  createdAt: '2026-10-01T00:00:00Z',
  ...overrides,
});

describe('getOverdueStatus - isOverdue', () => {
  test('should be overdue when incomplete and due before today', () => {
    expect(getOverdueStatus(buildTodo({ dueDate: '2026-10-15' }), TODAY).isOverdue).toBe(true);
  });

  test.each([
    ['due today', { dueDate: '2026-10-16' }],
    ['due in the future', { dueDate: '2026-10-20' }],
    ['no due date', { dueDate: null }],
    ['completed with a past due date', { dueDate: '2026-10-01', completed: 1 }],
    ['an invalid due date', { dueDate: 'garbage' }],
  ])('should not be overdue when %s', (_, overrides) => {
    expect(getOverdueStatus(buildTodo(overrides), TODAY)).toEqual({
      isOverdue: false,
      daysOverdue: 0,
    });
  });

  test('should ignore the time of day when comparing dates', () => {
    const startOfDay = new Date(2026, 9, 16, 0, 0);
    const endOfDay = new Date(2026, 9, 16, 23, 59);

    expect(getOverdueStatus(buildTodo({ dueDate: '2026-10-16' }), startOfDay).isOverdue).toBe(false);
    expect(getOverdueStatus(buildTodo({ dueDate: '2026-10-16' }), endOfDay).isOverdue).toBe(false);
    expect(getOverdueStatus(buildTodo({ dueDate: '2026-10-15' }), startOfDay).isOverdue).toBe(true);
  });

  test('should default to the current date when today is not provided', () => {
    jest.useFakeTimers().setSystemTime(TODAY);
    try {
      expect(getOverdueStatus(buildTodo({ dueDate: '2026-10-15' })).isOverdue).toBe(true);
      expect(getOverdueStatus(buildTodo({ dueDate: '2026-10-16' })).isOverdue).toBe(false);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('getOverdueStatus - daysOverdue', () => {
  test.each([
    ['2026-10-15', 1],
    ['2026-10-11', 5],
    ['2025-10-16', 365],
  ])('should count whole calendar days for due date %s', (dueDate, expectedDays) => {
    expect(getOverdueStatus(buildTodo({ dueDate }), TODAY).daysOverdue).toBe(expectedDays);
  });

  test('should count whole days across a daylight saving time change', () => {
    const afterSpringForward = new Date(2026, 2, 9, 12, 0);

    expect(getOverdueStatus(buildTodo({ dueDate: '2026-03-07' }), afterSpringForward).daysOverdue).toBe(2);
  });
});

describe('formatOverdueLabel', () => {
  test('should use singular wording for one day', () => {
    expect(formatOverdueLabel(1)).toBe('Overdue by 1 day');
  });

  test.each([2, 5, 30])('should use plural wording for %i days', (days) => {
    expect(formatOverdueLabel(days)).toBe(`Overdue by ${days} days`);
  });
});

describe('parseLocalDate', () => {
  test('should parse a YYYY-MM-DD string as local midnight', () => {
    const date = parseLocalDate('2026-10-15');

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(9);
    expect(date.getDate()).toBe(15);
    expect(date.getHours()).toBe(0);
    expect(date.getMinutes()).toBe(0);
  });

  test.each([null, undefined, ''])('should return null for empty value %p', (value) => {
    expect(parseLocalDate(value)).toBeNull();
  });

  test.each(['not-a-date', '2026-13-01', '2026-02-30', '2026-10-15T00:00:00Z', 20261015])(
    'should return null for invalid value %p',
    (value) => {
      expect(parseLocalDate(value)).toBeNull();
    }
  );
});
