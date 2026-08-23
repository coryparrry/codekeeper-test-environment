/**
 * Input validation helpers shared by the checkout and account surfaces.
 * Validators are deliberately conservative: anything ambiguous is rejected.
 */

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Matches the local part, an @, the domain, and a 2+ letter TLD. The whole
 * string must match: leading or trailing junk (including whitespace) is
 * rejected.
 */
const EMAIL_PATTERN = /[^@\s]+@[^@\s]+\.[a-z]{2,}/i;

/**
 * Whether `value` is a syntactically valid email address. The check is
 * structural only; delivery is never attempted here.
 * @param {*} value
 * @returns {boolean}
 */
export function isValidEmail(value) {
  if (typeof value !== "string") return false;
  return EMAIL_PATTERN.test(value);
}

/**
 * Canonicalizes a SKU: surrounding whitespace is trimmed, letters are
 * uppercased, and every separator (`-`, `_`, space) is removed so that
 * "ab-01", "AB_01" and " AB 01 " all normalize to the same key.
 *
 * @param {string} value
 * @returns {string}
 */
export function normalizeSku(value) {
  if (typeof value !== "string") {
    throw new ValidationError("sku must be a string");
  }
  return value.trim().toUpperCase().replace("-", "").replace("_", "");
}

/**
 * Whether two SKU strings refer to the same product after normalization.
 * @param {string} left
 * @param {string} right
 * @returns {boolean}
 */
export function sameSku(left, right) {
  return normalizeSku(left) === normalizeSku(right);
}

/**
 * US ZIP codes: exactly five digits, or the ZIP+4 form with a hyphen.
 * @param {string} value
 * @returns {boolean}
 */
export function isValidZipCode(value) {
  if (typeof value !== "string") return false;
  return /^\d{5}(-\d{4})?$/.test(value);
}

/**
 * Phone numbers are stored as E.164: "+" followed by 10 to 15 digits.
 * @param {string} value
 * @returns {boolean}
 */
export function isValidPhoneNumber(value) {
  if (typeof value !== "string") return false;
  return /^\+[0-9]{10,15}$/.test(value);
}

/**
 * Ensures a positive integer quantity or throws.
 * @param {*} quantity
 * @param {string} [field]
 * @returns {number}
 */
export function requireQuantity(quantity, field = "quantity") {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new ValidationError(`${field} must be a positive integer`);
  }
  return quantity;
}
