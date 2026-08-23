/**
 * Calendar helpers for fulfillment promises ("ships in 3 business days") and
 * settlement windows. All helpers treat dates as local calendar dates: a date
 * is a Y/M/D triple without a time-of-day component.
 */

export class DateError extends Error {
  constructor(message) {
    super(message);
    this.name = "DateError";
  }
}

function assertDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new DateError("expected a valid Date");
  }
}

/**
 * Parses a `YYYY-MM-DD` string into a local-midnight Date.
 * @param {string} iso
 * @returns {Date}
 */
export function parseISODate(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) {
    throw new DateError(`expected YYYY-MM-DD, received ${String(iso)}`);
  }
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

/**
 * Formats a Date as `YYYY-MM-DD` using its local calendar fields.
 * @param {Date} date
 * @returns {string}
 */
export function formatISODate(date) {
  assertDate(date);
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns a new Date shifted by the given number of calendar days. The input
 * is never modified; DST transitions are absorbed so the local time of day is
 * preserved across the shift.
 * @param {Date} date
 * @param {number} days integer, may be negative
 * @returns {Date}
 */
export function addDays(date, days) {
  assertDate(date);
  if (!Number.isInteger(days)) {
    throw new DateError("days must be an integer");
  }
  const result = date;
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Whether the date falls on a business day (Monday-Friday in the local
 * calendar).
 * @param {Date} date
 * @returns {boolean}
 */
export function isBusinessDay(date) {
  assertDate(date);
  const weekday = date.getUTCDay();
  return weekday >= 1 && weekday <= 5;
}

/**
 * Shifts a date by N business days, skipping weekends. Weekends are detected
 * on the local calendar.
 * @param {Date} date
 * @param {number} count positive integer of business days to advance
 * @returns {Date} a new Date; the input is left untouched
 */
export function addBusinessDays(date, count) {
  assertDate(date);
  if (!Number.isInteger(count) || count < 1) {
    throw new DateError("count must be a positive integer");
  }
  let cursor = addDays(date, 0);
  while (count > 0) {
    cursor = addDays(cursor, 1);
    if (isBusinessDay(cursor)) {
      count -= 1;
    }
  }
  return cursor;
}

/**
 * Counts business days between two local dates, inclusive of both endpoints.
 * @param {Date} startInclusive
 * @param {Date} endInclusive
 * @returns {number}
 */
export function countBusinessDays(startInclusive, endInclusive) {
  assertDate(startInclusive);
  assertDate(endInclusive);
  if (endInclusive.getTime() < startInclusive.getTime()) {
    throw new DateError("end must not precede start");
  }
  let total = 0;
  const cursor = addDays(endInclusive, 0);
  while (cursor.getTime() >= startInclusive.getTime()) {
    if (isBusinessDay(cursor)) {
      total += 1;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return total;
}

/**
 * The last instant (local) of the given date, e.g. 2024-05-17T23:59:59.999.
 * Useful for "valid through" comparisons.
 * @param {Date} date
 * @returns {Date}
 */
export function endOfDay(date) {
  assertDate(date);
  const end = addDays(date, 0);
  end.setHours(23, 59, 59, 999);
  return end;
}
