import test from "node:test";
import assert from "node:assert/strict";
import { checkoutSummary } from "../src/checkout.mjs";

test("checkout totals ordinary discounted lines without mutating input", () => {
  const lines = [{ sku: "standard", unitPrice: 20, quantity: 2, discountPercent: 25 }];
  const snapshot = structuredClone(lines);
  const result = checkoutSummary(lines);

  assert.deepEqual(result, {
    lineTotals: [
      {
        sku: "standard",
        quantity: 2,
        taxCategory: "standard",
        total: 30,
      },
    ],
    subtotal: 30,
    appliedCoupon: 0,
    couponReason: "no-eligible-lines",
    taxableSubtotal: 30,
    tax: 0,
    total: 30,
  });
  assert.deepEqual(lines, snapshot);
});

test("checkout rounds each discounted unit before aggregating quantity", () => {
  const result = checkoutSummary([
    { sku: "micro", unitPrice: 0.05, quantity: 3, discountPercent: 50 }
  ]);

  assert.equal(result.lineTotals[0].total, 0.09);
  assert.equal(result.total, 0.09);
});

test("a coupon reduces both the amount due and the taxable subtotal", () => {
  const result = checkoutSummary(
    [{ sku: "taxable", unitPrice: 20, quantity: 1, discountPercent: 25 }],
    { couponAmount: 5, taxPercent: 10 }
  );

  assert.equal(result.subtotal, 15);
  assert.equal(result.appliedCoupon, 5);
  assert.equal(result.taxableSubtotal, 10);
  assert.equal(result.tax, 1);
  assert.equal(result.total, 11);
});

test("a coupon is capped at the discounted subtotal", () => {
  const result = checkoutSummary(
    [{ sku: "free", unitPrice: 8, quantity: 1, discountPercent: 50 }],
    { couponAmount: 20 }
  );

  assert.equal(result.appliedCoupon, 4);
  assert.equal(result.total, 0);
});

test("checkout supports sku-restricted coupons and mixed tax categories", () => {
  const result = checkoutSummary(
    [
      {
        sku: "book",
        unitPrice: 10,
        quantity: 1,
        discountPercent: 0,
        taxCategory: "reduced",
      },
      {
        sku: "gift-card",
        unitPrice: 20,
        quantity: 1,
        discountPercent: 0,
        taxCategory: "exempt",
      },
    ],
    {
      coupon: { amount: 5, eligibleSkus: ["book"] },
      taxPercent: 20,
    },
  );

  assert.equal(result.appliedCoupon, 5);
  assert.equal(result.couponReason, "applied");
  assert.equal(result.total, 26);
});

test("checkout rejects malformed lines and rates", () => {
  assert.throws(() => checkoutSummary([]), /at least one line/);
  assert.throws(
    () => checkoutSummary([{ sku: "bad", unitPrice: 1, quantity: 0, discountPercent: 0 }]),
    /quantity/
  );
  assert.throws(
    () => checkoutSummary([{ sku: "bad", unitPrice: 1, quantity: 1, discountPercent: 101 }]),
    /discount percent/
  );
});
