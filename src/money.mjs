export function roundCurrency(value) {
  if (!Number.isFinite(value)) throw new TypeError("currency value must be finite");
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  return rounded === 0 ? 0 : rounded;
}
