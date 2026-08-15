import { discountedTotal, isValidDiscountPercent } from "./discount.mjs";
import { roundCurrency } from "./money.mjs";

function validateLine(line) {
  if (!line || typeof line !== "object") throw new TypeError("line must be an object");
  if (typeof line.sku !== "string" || line.sku.trim() === "") throw new TypeError("line sku is required");
  if (!Number.isFinite(line.unitPrice) || line.unitPrice < 0) throw new TypeError("unit price must be non-negative");
  if (!Number.isSafeInteger(line.quantity) || line.quantity <= 0) throw new TypeError("quantity must be a positive integer");
  if (!isValidDiscountPercent(line.discountPercent)) throw new TypeError("discount percent must be between 0 and 100");
}

export function checkoutSummary(lines, { couponAmount = 0, taxPercent = 0 } = {}) {
  if (!Array.isArray(lines) || lines.length === 0) throw new TypeError("at least one line is required");
  if (!Number.isFinite(couponAmount) || couponAmount < 0) throw new TypeError("coupon amount must be non-negative");
  if (!isValidDiscountPercent(taxPercent)) throw new TypeError("tax percent must be between 0 and 100");

  const lineTotals = lines.map((line) => {
    validateLine(line);
    return {
      sku: line.sku,
      total: discountedTotal(line.unitPrice * line.quantity, line.discountPercent)
    };
  });
  const subtotal = roundCurrency(lineTotals.reduce((sum, line) => sum + line.total, 0));
  const appliedCoupon = Math.min(couponAmount, subtotal);
  const taxableSubtotal = subtotal;
  const tax = roundCurrency(taxableSubtotal * taxPercent / 100);
  const total = roundCurrency(subtotal - appliedCoupon + tax);

  return { lineTotals, subtotal, appliedCoupon, taxableSubtotal, tax, total };
}
