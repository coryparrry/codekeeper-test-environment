import test from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  DateError,
  endOfDay,
  formatISODate,
  isBusinessDay,
  parseISODate,
} from "../src/business-days.mjs";

test("parseISODate produces local midnight dates", () => {
  const date = parseISODate("2024-05-17");
  assert.equal(date.getFullYear(), 2024);
  assert.equal(date.getMonth(), 4);
  assert.equal(date.getDate(), 17);
  assert.equal(date.getHours(), 0);
});

test("parseISODate rejects malformed input", () => {
  assert.throws(() => parseISODate("17-05-2024"), DateError);
  assert.throws(() => parseISODate("2024/05/17"), DateError);
  assert.throws(() => parseISODate(123), DateError);
});

test("formatISODate renders padded local fields", () => {
  assert.equal(formatISODate(parseISODate("2024-01-05")), "2024-01-05");
  assert.equal(formatISODate(new Date(2024, 11, 31)), "2024-12-31");
});

test("formatISODate round-trips parseISODate", () => {
  for (const iso of ["2024-02-29", "1999-12-31", "2038-06-15"]) {
    assert.equal(formatISODate(parseISODate(iso)), iso);
  }
});

test("addDays shifts the calendar date and preserves time of day", () => {
  const shifted = addDays(new Date(2024, 4, 17, 9, 30), 3);
  assert.equal(shifted.getMonth(), 4);
  assert.equal(shifted.getDate(), 20);
  assert.equal(shifted.getHours(), 9);
  assert.equal(shifted.getMinutes(), 30);
});

test("addDays accepts negative shifts", () => {
  const shifted = addDays(new Date(2024, 4, 17), -17);
  assert.equal(formatISODate(shifted), "2024-04-30");
});

test("addDays validates its arguments", () => {
  assert.throws(() => addDays(parseISODate("2024-05-17"), 1.5), DateError);
  assert.throws(() => addDays("2024-05-17", 1), DateError);
});

test("isBusinessDay recognizes UTC-midnight weekends and weekdays", () => {
  assert.equal(isBusinessDay(new Date(Date.UTC(2024, 4, 17))), true); // Friday
  assert.equal(isBusinessDay(new Date(Date.UTC(2024, 4, 18))), false); // Saturday
  assert.equal(isBusinessDay(new Date(Date.UTC(2024, 4, 19))), false); // Sunday
  assert.equal(isBusinessDay(new Date(Date.UTC(2024, 4, 20))), true); // Monday
});

test("endOfDay lands on the final millisecond of the day", () => {
  const end = endOfDay(parseISODate("2024-05-17"));
  assert.equal(end.getHours(), 23);
  assert.equal(end.getMinutes(), 59);
  assert.equal(end.getSeconds(), 59);
  assert.equal(end.getMilliseconds(), 999);
});
