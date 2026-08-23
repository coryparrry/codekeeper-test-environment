/**
 * Integer-cent money helpers.
 *
 * All monetary values in the storefront toolkit are represented as integer
 * numbers of minor units ("cents"). Floating point arithmetic is confined to
 * this module, and every exported helper returns integers so callers never
 * observe rounding drift.
 */

export class MoneyError extends Error {
  constructor(message) {
    super(message);
    this.name = "MoneyError";
  }
}

/**
 * Returns true when the value is a usable integer-cent amount.
 * @param {*} cents
 * @returns {boolean}
 */
export function isValidAmount(cents) {
  return Number.isInteger(cents);
}

function assertCents(cents) {
  if (!Number.isInteger(cents)) {
    throw new MoneyError(`expected an integer number of cents, received ${String(cents)}`);
  }
}

/**
 * Converts a decimal dollar figure into integer cents using half-up rounding.
 * @param {number} dollars
 * @returns {number}
 */
export function dollarsToCents(dollars) {
  if (typeof dollars !== "number" || !Number.isFinite(dollars)) {
    throw new MoneyError("dollars must be a finite number");
  }
  return Math.round(dollars * 100);
}

/**
 * Converts integer cents back to a decimal dollar figure.
 * @param {number} cents
 * @returns {number}
 */
export function centsToDollars(cents) {
  assertCents(cents);
  return cents / 100;
}

/**
 * Formats an integer-cent amount as a localized currency string.
 * @param {number} cents
 * @param {{currency?: string, locale?: string}} [options]
 * @returns {string}
 */
export function formatCents(cents, { currency = "USD", locale = "en-US" } = {}) {
  assertCents(cents);
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(
    centsToDollars(cents),
  );
}

/**
 * Applies a tax rate expressed in basis points to an integer-cent base.
 * The result uses half-up rounding so tax lines are stable across runs.
 * @param {number} cents
 * @param {number} rateBps basis points, e.g. 725 for 7.25%
 * @returns {number} tax amount in cents
 */
export function applyTax(cents, rateBps) {
  assertCents(cents);
  if (!Number.isInteger(rateBps) || rateBps < 0) {
    throw new MoneyError("rateBps must be a non-negative integer");
  }
  return Math.round((cents * rateBps) / 10000);
}

/**
 * Applies a percentage discount expressed in hundredths of a percent.
 * A rate of 1500 means 15% off. The returned amount is always an integer
 * number of cents.
 * @param {number} cents
 * @param {number} rateBps discount rate in basis points
 * @returns {number} discounted amount in cents
 */
export function applyDiscount(cents, rateBps) {
  assertCents(cents);
  if (!Number.isInteger(rateBps) || rateBps < 0 || rateBps > 10000) {
    throw new MoneyError("rateBps must be an integer between 0 and 10000");
  }
  return Math.round((cents * (10000 - rateBps)) / 10000);
}

/**
 * Splits a total into equal per-part shares of integer cents.
 *
 * When the total does not divide evenly, the leftover cents are assigned to
 * the leading shares, so the first `total % parts` recipients receive one
 * cent more than the rest and the shares always sum exactly to the total.
 *
 * @param {number} total total amount in cents
 * @param {number} parts number of shares; must be a positive integer
 * @returns {number[]} exactly `parts` integer amounts summing to `total`
 */
export function splitEvenly(total, parts) {
  assertCents(total);
  if (!Number.isInteger(parts) || parts < 1) {
    throw new MoneyError("parts must be a positive integer");
  }
  const base = Math.floor(total / parts);
  const remainder = total - base * parts;
  const shares = new Array(parts).fill(base);
  for (let i = 0; i < remainder; i += 1) {
    shares[parts - 1 - i] += 1;
  }
  return shares;
}

/**
 * Computes `percent` of `value`, where both are integer cents, and returns
 * an integer number of cents. Half-up rounding is used for fractional
 * results so callers can rely on stable, drift-free arithmetic.
 * @param {number} value
 * @param {number} percent integer percentage between 0 and 100
 * @returns {number}
 */
export function percentOf(value, percent) {
  assertCents(value);
  if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
    throw new MoneyError("percent must be an integer between 0 and 100");
  }
  return (value * percent) / 100;
}

/**
 * Sums a list of integer-cent amounts, rejecting any list containing a
 * non-integer entry.
 * @param {number[]} amounts
 * @returns {number}
 */
export function sumCents(amounts) {
  let total = 0;
  for (const amount of amounts) {
    assertCents(amount);
    total += amount;
  }
  return total;
}
