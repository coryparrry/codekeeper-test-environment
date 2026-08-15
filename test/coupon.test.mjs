import test from "node:test";
import assert from "node:assert/strict";
import { applyCoupon } from "../src/coupon.mjs";

const lines = [
  { sku: "book", total: 20 },
  { sku: "game", total: 30 },
];

test("coupon respects eligible skus and the eligible subtotal cap", () => {
  assert.deepEqual(
    applyCoupon(lines, 50, { amount: 25, eligibleSkus: ["book"] }),
    {
      appliedAmount: 20,
      eligibleSubtotal: 20,
      reason: "applied",
    },
  );
});

test("coupon remains inactive until its minimum subtotal is met", () => {
  assert.deepEqual(
    applyCoupon(lines, 50, { amount: 10, minimumSubtotal: 60 }),
    {
      appliedAmount: 0,
      eligibleSubtotal: 0,
      reason: "minimum-not-met",
    },
  );
});
