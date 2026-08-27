import { roundCurrency } from "./money.mjs";

function eligibleSubtotal(lineTotals, eligibleSkus) {
  if (!eligibleSkus) {
    return lineTotals.reduce((sum, line) => sum + line.total, 0);
  }
  const allowed = new Set(eligibleSkus);
  return lineTotals
    .filter((line) => allowed.has(line.sku))
    .reduce((sum, line) => sum + line.total, 0);
}

export function normalizeCoupon(coupon) {
  if (coupon === undefined || coupon === null) {
    return null;
  }
  if (typeof coupon !== "object") {
    throw new TypeError("coupon must be an object");
  }
  if (!Number.isFinite(coupon.amount) || coupon.amount < 0) {
    throw new TypeError("coupon amount must be non-negative");
  }
  if (!Number.isFinite(coupon.minimumSubtotal ?? 0) || (coupon.minimumSubtotal ?? 0) < 0) {
    throw new TypeError("coupon minimum subtotal must be non-negative");
  }
  if (
    coupon.eligibleSkus !== undefined &&
    (!Array.isArray(coupon.eligibleSkus) ||
      coupon.eligibleSkus.some((sku) => typeof sku !== "string" || sku === ""))
  ) {
    throw new TypeError("coupon eligible skus must be an array of strings");
  }

  return {
    amount: roundCurrency(coupon.amount),
    minimumSubtotal: roundCurrency(coupon.minimumSubtotal ?? 0),
    eligibleSkus: coupon.eligibleSkus ? [...coupon.eligibleSkus] : null,
  };
}

export function applyCoupon(lineTotals, subtotal, coupon) {
  const normalized = normalizeCoupon(coupon);
  if (!normalized || subtotal < normalized.minimumSubtotal) {
    return {
      appliedAmount: 0,
      eligibleSubtotal: 0,
      reason: normalized ? "minimum-not-met" : "no-coupon",
    };
  }

  const eligible = roundCurrency(eligibleSubtotal(lineTotals, normalized.eligibleSkus));
  const appliedAmount = roundCurrency(Math.min(normalized.amount, eligible, subtotal));
  return {
    appliedAmount,
    eligibleSubtotal: eligible,
    reason: appliedAmount > 0 ? "applied" : "no-eligible-lines",
  };
}
