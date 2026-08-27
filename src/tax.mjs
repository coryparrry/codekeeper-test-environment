import { isValidDiscountPercent } from "./discount.mjs";
import { roundCurrency } from "./money.mjs";

const CATEGORY_MULTIPLIERS = {
  standard: 1,
  reduced: 0.5,
  exempt: 0,
};

export function calculateTax(lineTotals, subtotal, appliedCoupon, taxPercent) {
  if (!isValidDiscountPercent(taxPercent)) {
    throw new TypeError("tax percent must be between 0 and 100");
  }
  if (!Number.isFinite(appliedCoupon) || appliedCoupon < 0 || appliedCoupon > subtotal) {
    throw new TypeError("applied coupon must be within the subtotal");
  }

  const weightedTaxableBeforeCoupon = roundCurrency(
    lineTotals.reduce((sum, line) => {
      const multiplier = CATEGORY_MULTIPLIERS[line.taxCategory];
      if (multiplier === undefined) {
        throw new TypeError(`unknown tax category: ${line.taxCategory}`);
      }
      return sum + line.total * multiplier;
    }, 0),
  );

  const taxableShare = subtotal === 0 ? 0 : weightedTaxableBeforeCoupon / subtotal;
  const couponTaxReduction = roundCurrency(appliedCoupon * taxableShare);
  const taxableSubtotal = weightedTaxableBeforeCoupon;
  const tax = roundCurrency(taxableSubtotal * (taxPercent / 100));

  return {
    weightedTaxableBeforeCoupon,
    couponTaxReduction,
    taxableSubtotal,
    tax,
  };
}
