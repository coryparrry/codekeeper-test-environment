import { createCatalog, materializeCart } from "./catalog.mjs";
import { applyCoupon } from "./coupon.mjs";
import { isValidDiscountPercent } from "./discount.mjs";
import { roundCurrency } from "./money.mjs";
import { priceLine } from "./pricing.mjs";
import { calculateTax } from "./tax.mjs";

function inlineCatalog(lines) {
  return createCatalog(
    lines.map((line) => ({
      sku: line.sku,
      unitPrice: line.unitPrice,
      taxCategory: line.taxCategory ?? "standard",
    })),
  );
}

export function checkoutSummary(
  lines,
  { coupon, couponAmount = 0, taxPercent = 0 } = {},
) {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new TypeError("at least one line is required");
  }
  if (!isValidDiscountPercent(taxPercent)) {
    throw new TypeError("tax percent must be between 0 and 100");
  }

  const catalog = inlineCatalog(lines);
  const materializedLines = materializeCart(
    lines.map(({ sku, quantity, discountPercent }) => ({
      sku,
      quantity,
      discountPercent,
    })),
    catalog,
  );
  const lineTotals = materializedLines.map(priceLine);
  const subtotal = roundCurrency(lineTotals.reduce((sum, line) => sum + line.total, 0));
  const couponResult = applyCoupon(
    lineTotals,
    subtotal,
    coupon ?? { amount: couponAmount },
  );
  const taxResult = calculateTax(
    lineTotals,
    subtotal,
    couponResult.appliedAmount,
    taxPercent,
  );
  const total = roundCurrency(subtotal - couponResult.appliedAmount + taxResult.tax);

  return {
    lineTotals,
    subtotal,
    appliedCoupon: couponResult.appliedAmount,
    couponReason: couponResult.reason,
    taxableSubtotal: taxResult.taxableSubtotal,
    tax: taxResult.tax,
    total,
  };
}
