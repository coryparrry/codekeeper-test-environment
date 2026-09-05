import test from "node:test";
import assert from "node:assert/strict";
import { discountBreakdown, discountedTotal, isValidDiscountPercent } from "../src/discount.mjs";

test("isValidDiscountPercent accepts the inclusive boundaries", () => {
  assert.equal(isValidDiscountPercent(0), true);
  assert.equal(isValidDiscountPercent(100), true);
});

test("isValidDiscountPercent rejects values outside the finite range", () => {
  assert.equal(isValidDiscountPercent(-1), false);
  assert.equal(isValidDiscountPercent(101), false);
  assert.equal(isValidDiscountPercent(Number.NaN), false);
});

test("discountedTotal leaves the price unchanged for a zero-percent discount", () => {
  assert.equal(discountedTotal(19.99, 0), 19.99);
});

test("discountedTotal calculates a deterministic percentage discount", () => {
  assert.equal(discountedTotal(19.99, 25), 14.99);
});

test("discountedTotal accepts a full discount", () => {
  assert.equal(discountedTotal(19.99, 100), 0);
});

test("discountedTotal normalizes negative zero", () => {
  const result = discountedTotal(-0, 25);
  assert.equal(Object.is(result, 0), true);
  assert.equal(Object.is(result, -0), false);
});

test("discountedTotal rejects an invalid discount", () => {
  assert.throws(() => discountedTotal(19.99, 101), TypeError);
});

test("discountBreakdown returns the existing calculation and rounded savings", () => {
  assert.deepEqual(discountBreakdown(20, 25), {
    price: 20, percent: 25, savings: 5, total: 15,
  });
});

test("discountBreakdown inherits percentage validation", () => {
  assert.throws(() => discountBreakdown(20, 101), TypeError);
});

test("discountBreakdown preserves supported fractional percentages", () => {
  assert.deepEqual(discountBreakdown(20, 12.3456), {
    price: 20, percent: 12.3456, savings: 2.47, total: 17.53,
  });
});
