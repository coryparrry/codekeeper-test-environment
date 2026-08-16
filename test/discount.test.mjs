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

test("discountedTotal keeps finite large prices finite", () => {
  const result = discountedTotal(Number.MAX_VALUE, 1);
  assert.equal(result, Number.MAX_VALUE * 0.99);
  assert.equal(Number.isFinite(result), true);
});

test("discountedTotal rejects an invalid discount", () => {
  assert.throws(() => discountedTotal(19.99, 101), TypeError);
});
