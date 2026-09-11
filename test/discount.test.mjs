import test from "node:test";
import assert from "node:assert/strict";
import {
  discountBreakdown,
  discountedTotal,
  isValidDiscountPercent,
} from "../src/discount.mjs";

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

test("discountBreakdown reports the price, discount, savings, and total", () => {
  assert.deepEqual(discountBreakdown(19.99, 25), {
    price: 19.99,
    percent: 25,
    savings: 5,
    total: 14.99,
  });
});

test("discountBreakdown shares discountedTotal input validation", () => {
  assert.throws(() => discountBreakdown(-1, 25), TypeError);
});

test("discountBreakdown reports a full discount without negative zero", () => {
  assert.deepEqual(discountBreakdown(19.99, 100), {
    price: 19.99,
    percent: 100,
    savings: 19.99,
    total: 0,
  });
});
