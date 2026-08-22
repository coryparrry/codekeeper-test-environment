import test from "node:test";
import assert from "node:assert/strict";
import { calculateTax } from "../src/tax.mjs";

test("tax weights reduced and exempt categories", () => {
  const result = calculateTax(
    [
      { sku: "standard", total: 10, taxCategory: "standard" },
      { sku: "reduced", total: 10, taxCategory: "reduced" },
      { sku: "exempt", total: 10, taxCategory: "exempt" },
    ],
    30,
    0,
    20,
  );

  assert.equal(result.taxableSubtotal, 15);
  assert.equal(result.tax, 3);
});

test("tax validates rates and coupon bounds", () => {
  const lines = [{ sku: "standard", total: 10, taxCategory: "standard" }];
  assert.throws(() => calculateTax(lines, 10, 0, 101), /tax percent/);
  assert.throws(() => calculateTax(lines, 10, 11, 10), /applied coupon/);
});
