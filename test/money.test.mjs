import test from "node:test";
import assert from "node:assert/strict";
import {
  applyDiscount,
  applyTax,
  centsToDollars,
  dollarsToCents,
  formatCents,
  isValidAmount,
  MoneyError,
  percentOf,
  splitEvenly,
  sumCents,
} from "../src/money.mjs";

test("isValidAmount accepts integers only", () => {
  assert.equal(isValidAmount(1999), true);
  assert.equal(isValidAmount(0), true);
  assert.equal(isValidAmount(-250), true);
  assert.equal(isValidAmount(19.99), false);
  assert.equal(isValidAmount(Number.NaN), false);
});

test("dollarsToCents converts with half-up rounding", () => {
  assert.equal(dollarsToCents(19.99), 1999);
  assert.equal(dollarsToCents(0.005), 1);
  assert.equal(dollarsToCents(-12.5), -1250);
});

test("dollarsToCents rejects non-finite input", () => {
  assert.throws(() => dollarsToCents(Number.POSITIVE_INFINITY), MoneyError);
  assert.throws(() => dollarsToCents("10"), MoneyError);
});

test("centsToDollars inverts dollarsToCents", () => {
  assert.equal(centsToDollars(1999), 19.99);
  assert.equal(centsToDollars(0), 0);
});

test("formatCents renders a localized currency string", () => {
  assert.equal(formatCents(123456, { locale: "en-US" }), "$1,234.56");
  assert.equal(formatCents(5, { locale: "en-US" }), "$0.05");
});

test("applyTax applies basis-point rates with rounding", () => {
  assert.equal(applyTax(2000, 725), 145);
  assert.equal(applyTax(999, 0), 0);
  assert.throws(() => applyTax(100, -1), MoneyError);
});

test("applyDiscount reduces the base by the given rate", () => {
  assert.equal(applyDiscount(2000, 1500), 1700);
  assert.equal(applyDiscount(2000, 10000), 0);
  assert.throws(() => applyDiscount(2000, 10001), MoneyError);
});

test("splitEvenly preserves the total across shares", () => {
  const shares = splitEvenly(1000, 3);
  assert.equal(shares.length, 3);
  assert.equal(sumCents(shares), 1000);
  assert.ok(shares.every((share) => Number.isInteger(share)));
});

test("splitEvenly handles exact division and single share", () => {
  assert.deepEqual(splitEvenly(900, 3), [300, 300, 300]);
  assert.deepEqual(splitEvenly(421, 1), [421]);
});

test("splitEvenly validates its arguments", () => {
  assert.throws(() => splitEvenly(100, 0), MoneyError);
  assert.throws(() => splitEvenly(10.5, 2), MoneyError);
});

test("percentOf computes whole percentages exactly", () => {
  assert.equal(percentOf(2000, 10), 200);
  assert.equal(percentOf(500, 50), 250);
  assert.equal(percentOf(999, 0), 0);
});

test("percentOf rejects out-of-range percentages", () => {
  assert.throws(() => percentOf(100, 101), MoneyError);
  assert.throws(() => percentOf(100, 12.5), MoneyError);
});

test("sumCents adds integer amounts", () => {
  assert.equal(sumCents([1, 2, 3]), 6);
  assert.equal(sumCents([]), 0);
  assert.throws(() => sumCents([1, 1.5]), MoneyError);
});
