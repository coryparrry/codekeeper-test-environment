import test from "node:test";
import assert from "node:assert/strict";
import {
  availableUnits,
  confirmReservation,
  createInventory,
  InventoryError,
  releaseStock,
  reserveStock,
  restock,
} from "../src/inventory.mjs";

test("createInventory seeds records and validates units", () => {
  const inventory = createInventory({ "TEE-01": 10, "MUG-02": 0 });
  assert.equal(availableUnits(inventory, "TEE-01"), 10);
  assert.equal(availableUnits(inventory, "MUG-02"), 0);
  assert.equal(availableUnits(inventory, "MISSING"), 0);
  assert.throws(() => createInventory({ BAD: -1 }), InventoryError);
});

test("reserveStock reduces availability and reports an id", async () => {
  const inventory = createInventory({ "TEE-01": 5 });
  const reservation = await reserveStock(inventory, "TEE-01", 2);
  assert.equal(reservation.quantity, 2);
  assert.equal(typeof reservation.reservationId, "string");
  assert.equal(availableUnits(inventory, "TEE-01"), 3);
});

test("reserveStock refuses to oversell a known sku", async () => {
  const inventory = createInventory({ "TEE-01": 1 });
  await assert.rejects(
    () => reserveStock(inventory, "TEE-01", 2),
    InventoryError,
  );
});

test("reserveStock rejects unknown skus and bad quantities", async () => {
  const inventory = createInventory({});
  await assert.rejects(() => reserveStock(inventory, "GHOST", 1), InventoryError);
  await assert.rejects(
    () => reserveStock(inventory, "GHOST", 0),
    InventoryError,
  );
});

test("releaseStock returns reserved units to availability", async () => {
  const inventory = createInventory({ "TEE-01": 4 });
  const reservation = await reserveStock(inventory, "TEE-01", 2);
  assert.equal(availableUnits(inventory, "TEE-01"), 2);
  releaseStock(inventory, "TEE-01", reservation);
  assert.equal(availableUnits(inventory, "TEE-01"), 4);
});

test("confirmReservation permanently consumes the units", async () => {
  const inventory = createInventory({ "TEE-01": 6 });
  const reservation = await reserveStock(inventory, "TEE-01", 2);
  confirmReservation(inventory, "TEE-01", reservation);
  assert.equal(availableUnits(inventory, "TEE-01"), 4);
});

test("restock adds units and registers new skus", () => {
  const inventory = createInventory({ "TEE-01": 2 });
  restock(inventory, "TEE-01", 3);
  restock(inventory, "NEW-1", 7);
  assert.equal(availableUnits(inventory, "TEE-01"), 5);
  assert.equal(availableUnits(inventory, "NEW-1"), 7);
});
