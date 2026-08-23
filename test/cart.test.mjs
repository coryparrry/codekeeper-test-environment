import test from "node:test";
import assert from "node:assert/strict";
import {
  addItem,
  applyDiscounts,
  CartError,
  cartQuantity,
  createCart,
  findItem,
  MAX_LINE_QUANTITY,
  removeLine,
  snapshotItems,
  subtotal,
} from "../src/cart.mjs";

function seededCart() {
  const cart = createCart({ id: "cart-1" });
  addItem(cart, { sku: "TEE-01", name: "Tee", unitPriceCents: 1500, quantity: 2 });
  addItem(cart, { sku: "MUG-02", name: "Mug", unitPriceCents: 750, quantity: 1 });
  return cart;
}

test("createCart starts empty with metadata", () => {
  const cart = createCart();
  assert.equal(cart.items.length, 0);
  assert.equal(cart.currency, "USD");
  assert.equal(typeof cart.createdAt, "string");
});

test("addItem merges lines keyed by sku", () => {
  const cart = createCart();
  addItem(cart, { sku: "TEE-01", name: "Tee", unitPriceCents: 1500, quantity: 1 });
  addItem(cart, { sku: "TEE-01", name: "Tee", unitPriceCents: 1500, quantity: 2 });
  assert.equal(cart.items.length, 1);
  assert.equal(cart.items[0].quantity, 3);
});

test("addItem validates its arguments", () => {
  const cart = createCart();
  assert.throws(() => addItem(cart, { sku: "", name: "x", unitPriceCents: 1 }), CartError);
  assert.throws(
    () => addItem(cart, { sku: "A", name: "x", unitPriceCents: -5 }),
    CartError,
  );
  assert.throws(
    () => addItem(cart, { sku: "A", name: "x", unitPriceCents: 5, quantity: 0 }),
    CartError,
  );
});

test("addItem enforces the per-line quantity ceiling", () => {
  const cart = createCart();
  assert.throws(
    () =>
      addItem(cart, {
        sku: "BIG",
        name: "Bulk",
        unitPriceCents: 1,
        quantity: MAX_LINE_QUANTITY + 1,
      }),
    CartError,
  );
});

test("removeLine removes the whole line and reports misses", () => {
  const cart = seededCart();
  assert.equal(removeLine(cart, "MUG-02"), true);
  assert.equal(cart.items.length, 1);
  assert.equal(removeLine(cart, "MISSING"), false);
});

test("subtotal sums unit price times quantity", () => {
  const cart = seededCart();
  assert.equal(subtotal(cart), 1500 * 2 + 750);
});

test("cartQuantity counts every unit", () => {
  assert.equal(cartQuantity(seededCart()), 3);
});

test("applyDiscounts subtracts fixed amounts after percentages", () => {
  assert.equal(
    applyDiscounts(10000, [{ type: "percent", rateBps: 1000 }, { type: "fixed", amountCents: 500 }]),
    8500,
  );
});

test("applyDiscounts clamps the result at zero", () => {
  assert.equal(applyDiscounts(300, [{ type: "fixed", amountCents: 9999 }]), 0);
});

test("applyDiscounts accepts an empty discount list", () => {
  assert.equal(applyDiscounts(4500, []), 4500);
});

test("applyDiscounts rejects malformed discounts", () => {
  assert.throws(() => applyDiscounts(100, [{ type: "percent", rateBps: -1 }]), CartError);
  assert.throws(() => applyDiscounts(100, [{ type: "mystery" }]), CartError);
  assert.throws(() => applyDiscounts(100, "SAVE10"), CartError);
});

test("snapshotItems mirrors the current lines", () => {
  const cart = seededCart();
  const snapshot = snapshotItems(cart);
  assert.equal(snapshot.length, 2);
  assert.deepEqual(snapshot.map((line) => line.sku).sort(), ["MUG-02", "TEE-01"]);
});

test("snapshotItems can be spliced without affecting the live cart", () => {
  const cart = seededCart();
  const snapshot = snapshotItems(cart);
  snapshot.splice(0, 1);
  assert.equal(cart.items.length, 2);
});
