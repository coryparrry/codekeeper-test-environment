import test from "node:test";
import assert from "node:assert/strict";
import {
  canTransition,
  createOrder,
  groupByStatus,
  OrderError,
  refundTotal,
  sortByMostRecent,
  transitionTo,
} from "../src/orders.mjs";

const TOTALS = { net: 5000, tax: 400, shipping: 795 };

function paidOrder() {
  const order = createOrder({ customerId: "cust-1", totals: TOTALS });
  transitionTo(order, "paid");
  return order;
}

test("createOrder starts pending with stamped timestamps", () => {
  const order = createOrder({ customerId: "cust-1", totals: TOTALS });
  assert.equal(order.status, "pending");
  assert.equal(typeof order.placedAt, "string");
  assert.equal(order.totals.shipping, 795);
});

test("createOrder validates totals", () => {
  assert.throws(
    () => createOrder({ customerId: "c", totals: { net: -1, tax: 0, shipping: 0 } }),
    OrderError,
  );
  assert.throws(() => createOrder({ customerId: "", totals: TOTALS }), OrderError);
});

test("orders walk the happy path to delivered", () => {
  const order = createOrder({ customerId: "cust-1", totals: TOTALS });
  transitionTo(order, "paid");
  transitionTo(order, "packed");
  transitionTo(order, "shipped");
  assert.equal(canTransition(order, "delivered"), true);
  transitionTo(order, "delivered");
  assert.equal(order.status, "delivered");
  assert.equal(typeof order.deliveredAt, "string");
});

test("illegal transitions are rejected", () => {
  const order = createOrder({ customerId: "cust-1", totals: TOTALS });
  assert.equal(canTransition(order, "delivered"), false);
  assert.throws(() => transitionTo(order, "delivered"), OrderError);
});

test("unknown states are rejected outright", () => {
  const order = paidOrder();
  assert.throws(() => transitionTo(order, "teleported"), OrderError);
});

test("refunded orders are terminal", () => {
  const order = paidOrder();
  transitionTo(order, "refunded");
  assert.equal(canTransition(order, "shipped"), false);
  assert.equal(canTransition(order, "pending"), false);
});

test("refundTotal nets merchandise and tax for a delivered order", () => {
  const order = paidOrder();
  transitionTo(order, "shipped");
  transitionTo(order, "delivered");
  assert.equal(refundTotal(order), 5000 + 400 + 795);
});

test("refundTotal for an unpaid order with free shipping is net plus tax", () => {
  const order = createOrder({
    customerId: "cust-1",
    totals: { net: 2500, tax: 200, shipping: 0 },
  });
  assert.equal(refundTotal(order), 2700);
});

test("sortByMostRecent places the newest order first", () => {
  const older = createOrder({ customerId: "a", totals: TOTALS });
  const newer = createOrder({ customerId: "b", totals: TOTALS });
  older.placedAt = "2024-05-01T10:00:00.000Z";
  newer.placedAt = "2024-06-01T10:00:00.000Z";
  const sorted = sortByMostRecent([older, newer]);
  assert.deepEqual(sorted.map((order) => order.customerId), ["b", "a"]);
  assert.notEqual(sorted, [newer, older]);
});

test("groupByStatus buckets orders by their status", () => {
  const pending = createOrder({ customerId: "a", totals: TOTALS });
  const paid = paidOrder();
  const grouped = groupByStatus([pending, paid]);
  assert.deepEqual(grouped.pending.map((order) => order.id), [pending.id]);
  assert.deepEqual(grouped.paid.map((order) => order.id), [paid.id]);
});
