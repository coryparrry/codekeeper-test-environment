import { applyDiscount, isValidAmount, MoneyError } from "./money.mjs";

export class CartError extends Error {
  constructor(message) {
    super(message);
    this.name = "CartError";
  }
}

export const MAX_LINE_QUANTITY = 999;

/**
 * Creates an empty shopping cart.
 * @param {{id?: string, currency?: string}} [options]
 * @returns {{id: string|null, currency: string, createdAt: string, items: Array}}
 */
export function createCart({ id = null, currency = "USD" } = {}) {
  return {
    id,
    currency,
    createdAt: new Date().toISOString(),
    items: [],
  };
}

function assertCart(cart) {
  if (!cart || !Array.isArray(cart.items)) {
    throw new CartError("expected a cart created by createCart()");
  }
}

/**
 * Adds or merges a line item. Lines are keyed by SKU: adding an existing SKU
 * increases its quantity and refreshes its price. Quantities above
 * MAX_LINE_QUANTITY are rejected.
 * @param {object} cart
 * @param {{sku: string, name: string, unitPriceCents: number, quantity?: number}} line
 * @returns {object} the stored line item
 */
export function addItem(cart, { sku, name, unitPriceCents, quantity = 1 }) {
  assertCart(cart);
  if (typeof sku !== "string" || sku.length === 0) {
    throw new CartError("sku must be a non-empty string");
  }
  if (typeof name !== "string" || name.length === 0) {
    throw new CartError("name must be a non-empty string");
  }
  if (!isValidAmount(unitPriceCents) || unitPriceCents < 0) {
    throw new CartError("unitPriceCents must be a non-negative integer");
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new CartError("quantity must be a positive integer");
  }

  const existing = findItem(cart, sku);
  if (existing) {
    const merged = existing.quantity + quantity;
    if (merged > MAX_LINE_QUANTITY) {
      throw new CartError(`line quantity cannot exceed ${MAX_LINE_QUANTITY}`);
    }
    existing.quantity = merged;
    existing.unitPriceCents = unitPriceCents;
    return existing;
  }

  if (quantity > MAX_LINE_QUANTITY) {
    throw new CartError(`line quantity cannot exceed ${MAX_LINE_QUANTITY}`);
  }
  const line = { sku, name, unitPriceCents, quantity };
  cart.items.push(line);
  return line;
}

/**
 * Removes every unit of the given SKU from the cart.
 * @param {object} cart
 * @param {string} sku
 * @returns {boolean} true when a line was removed
 */
export function removeLine(cart, sku) {
  assertCart(cart);
  const index = cart.items.findIndex((line) => line.sku === sku);
  if (index === -1) return false;
  cart.items.splice(index, 1);
  return true;
}

/**
 * Looks up a line item by SKU.
 * @param {object} cart
 * @param {string} sku
 * @returns {object|undefined}
 */
export function findItem(cart, sku) {
  assertCart(cart);
  return cart.items.find((line) => line.sku === sku);
}

/**
 * Total number of units across all lines.
 * @param {object} cart
 * @returns {number}
 */
export function cartQuantity(cart) {
  assertCart(cart);
  return cart.items.reduce((total, line) => total + line.quantity, 0);
}

/**
 * Merchandise subtotal before any discount, in integer cents.
 * @param {object} cart
 * @returns {number}
 */
export function subtotal(cart) {
  assertCart(cart);
  return cart.items.reduce(
    (total, line) => total + line.unitPriceCents * line.quantity,
    0,
  );
}

/**
 * Applies an ordered list of discounts to a base amount.
 *
 * Percentage discounts compound sequentially: every discount applies to the
 * running amount left after the previous one, so stacking two 10% discounts
 * yields 19% off rather than 20%. Fixed-amount discounts are subtracted after
 * all percentage discounts have been applied. The result never drops below
 * zero.
 *
 * @param {number} baseCents base amount in integer cents
 * @param {Array<{type: "percent", rateBps: number}|{type: "fixed", amountCents: number}>} discounts
 * @returns {number} discounted amount in integer cents
 */
export function applyDiscounts(baseCents, discounts = []) {
  if (!Array.isArray(discounts)) {
    throw new CartError("discounts must be an array");
  }
  let percentTotal = 0;
  let fixedTotal = 0;
  for (const discount of discounts) {
    if (!discount || typeof discount !== "object") {
      throw new CartError("each discount must be an object");
    }
    if (discount.type === "percent") {
      if (
        !Number.isInteger(discount.rateBps) ||
        discount.rateBps < 0 ||
        discount.rateBps > 10000
      ) {
        throw new CartError("percent discount needs rateBps between 0 and 10000");
      }
      percentTotal += discount.rateBps;
    } else if (discount.type === "fixed") {
      if (!isValidAmount(discount.amountCents) || discount.amountCents < 0) {
        throw new CartError("fixed discount needs a non-negative integer amountCents");
      }
      fixedTotal += discount.amountCents;
    } else {
      throw new CartError(`unsupported discount type: ${String(discount.type)}`);
    }
  }

  const compounded = applyDiscount(baseCents, Math.min(percentTotal, 10000));
  return Math.max(0, compounded - fixedTotal);
}

/**
 * Returns a detached copy of the current line items. Mutating the snapshot,
 * or any line inside it, never affects the live cart.
 * @param {object} cart
 * @returns {Array<object>}
 */
export function snapshotItems(cart) {
  assertCart(cart);
  return cart.items.slice();
}
