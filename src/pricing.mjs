import { discountedTotal, isValidDiscountPercent } from "./discount.mjs";

export function priceLine(line) {
  if (!isValidDiscountPercent(line.discountPercent)) {
    throw new TypeError("discount percent must be between 0 and 100");
  }

  return {
    sku: line.sku,
    quantity: line.quantity,
    taxCategory: line.taxCategory,
    total: discountedTotal(line.unitPrice * line.quantity, line.discountPercent),
  };
}
