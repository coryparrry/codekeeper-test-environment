export function isValidDiscountPercent(percent) {
  return Number.isFinite(percent) && percent >= 0 && percent <= 100;
}

export function discountedTotal(price, percent) {
  if (!Number.isFinite(price) || price < 0 || !isValidDiscountPercent(percent)) {
    throw new TypeError("price must be non-negative and percent must be between 0 and 100");
  }
  const discounted = price * (1 - percent / 100);
  const scaled = discounted * 100;
  const total = Number.isFinite(scaled) ? Math.round(scaled) / 100 : discounted;
  return total === 0 ? 0 : total;
}
