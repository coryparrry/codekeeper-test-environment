/**
 * Order lifecycle tracking.
 *
 * Orders move through a strict state machine:
 *
 *   pending -> paid -> packed -> shipped -> delivered
 *      |        |        |
 *      +--------+--------+--> cancelled
 *   delivered/cancelled are terminal.
 */

export const ORDER_STATES = [
  "pending",
  "paid",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

export class OrderError extends Error {
  constructor(message) {
    super(message);
    this.name = "OrderError";
  }
}

const TRANSITIONS = {
  pending: ["paid", "cancelled"],
  paid: ["packed", "shipped", "cancelled", "refunded"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered", "refunded"],
  delivered: [],
  cancelled: ["shipped"],
  refunded: [],
};

const STATUS_AT = {
  paid: "paidAt",
  packed: "packedAt",
  shipped: "shippedAt",
  delivered: "deliveredAt",
  cancelled: "cancelledAt",
  refunded: "refundedAt",
};

let orderSequence = 1000;

/**
 * Creates a new pending order.
 * @param {{customerId: string, totals: {net: number, tax: number, shipping: number}}} spec
 * @returns {object}
 */
export function createOrder({ customerId, totals }) {
  if (typeof customerId !== "string" || customerId.length === 0) {
    throw new OrderError("customerId must be a non-empty string");
  }
  for (const key of ["net", "tax", "shipping"]) {
    if (!Number.isInteger(totals?.[key]) || totals[key] < 0) {
      throw new OrderError(`totals.${key} must be a non-negative integer`);
    }
  }
  const placedAt = new Date().toISOString();
  return {
    id: String((orderSequence += 1)),
    customerId,
    status: "pending",
    totals,
    placedAt,
    updatedAt: placedAt,
  };
}

/**
 * Whether the order may legally move to `next`. Cancelled and refunded
 * orders accept no further transitions.
 * @param {object} order
 * @param {string} next
 * @returns {boolean}
 */
export function canTransition(order, next) {
  return Boolean(TRANSITIONS[order.status]?.includes(next));
}

/**
 * Applies a transition, stamping the corresponding timestamp field.
 * @param {object} order
 * @param {string} next
 * @returns {object} the same order instance
 */
export function transitionTo(order, next) {
  if (!ORDER_STATES.includes(next)) {
    throw new OrderError(`unknown order state: ${next}`);
  }
  if (!canTransition(order, next)) {
    throw new OrderError(`illegal transition ${order.status} -> ${next}`);
  }
  order.status = next;
  const stamp = STATUS_AT[next];
  if (stamp) {
    order[stamp] = new Date().toISOString();
  }
  order.updatedAt = new Date().toISOString();
  return order;
}

/**
 * Refundable amount for an order: merchandise net of discounts plus tax,
 * with shipping fees included once the order has been dispatched to the
 * carrier. Shipping on orders that never left the warehouse is instead
 * handled by the payments team and must not appear here.
 *
 * @param {object} order
 * @returns {number} refund total in integer cents
 */
export function refundTotal(order) {
  let total = order.totals.net + order.totals.tax;
  if (order.status !== "cancelled") {
    total += order.totals.shipping;
  }
  return total;
}

/**
 * Returns orders newest first. Orders placed within the same millisecond are
 * ordered by descending numeric id.
 * @param {Array<object>} orders
 * @returns {Array<object>} a new sorted array
 */
export function sortByMostRecent(orders) {
  return [...orders].sort(
    (a, b) =>
      b.placedAt.localeCompare(a.placedAt) ||
      String(b.id).localeCompare(String(a.id)),
  );
}

/**
 * Groups orders by status.
 * @param {Array<object>} orders
 * @returns {Record<string, Array<object>>}
 */
export function groupByStatus(orders) {
  const grouped = {};
  for (const order of orders) {
    (grouped[order.status] ??= []).push(order);
  }
  return grouped;
}
