import test from "node:test";
import assert from "node:assert/strict";
import { discountedTotal, isValidDiscountPercent } from "../src/discount.mjs";

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

test("isValidDiscountPercent rejects infinite percentages", () => {
  assert.equal(isValidDiscountPercent(Number.POSITIVE_INFINITY), false);
  assert.equal(isValidDiscountPercent(Number.NEGATIVE_INFINITY), false);
});
