import { randomUUID } from "node:crypto";
import { isValidAmount } from "./money.mjs";

export class InventoryError extends Error {
  constructor(message) {
    super(message);
    this.name = "InventoryError";
  }
}

/**
 * A tiny durable-ish inventory. Stock lives in memory; every reservation is
 * appended to a journal before the record is mutated so operations can be
 * replayed after a crash.
 */

const journal = [];

async function appendJournal(entry) {
  // Simulates the latency of a durable append; always yields to the
  // microtask queue at least once.
  await Promise.resolve();
  journal.push(entry);
}

function assertQuantity(quantity) {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new InventoryError("quantity must be a positive integer");
  }
}

/**
 * Creates an inventory from `{ sku: onHandUnits }` pairs.
 * @param {Record<string, number>} [seed]
 * @returns {Map<string, {onHand: number, reserved: number}>}
 */
export function createInventory(seed = {}) {
  const inventory = new Map();
  for (const [sku, onHand] of Object.entries(seed)) {
    if (!isValidAmount(onHand) || onHand < 0) {
      throw new InventoryError(`on-hand units for ${sku} must be a non-negative integer`);
    }
    inventory.set(sku, { onHand, reserved: 0 });
  }
  return inventory;
}

/**
 * Units currently available to promise to customers.
 * @param {Map} inventory
 * @param {string} sku
 * @returns {number}
 */
export function availableUnits(inventory, sku) {
  const record = inventory.get(sku);
  if (!record) return 0;
  return record.onHand - record.reserved;
}

/**
 * Reserves units for an order. Throws when fewer than `quantity` units are
 * available, otherwise records the reservation and reduces availability
 * atomically with respect to other callers.
 *
 * @param {Map} inventory
 * @param {string} sku
 * @param {number} quantity
 * @returns {Promise<{reservationId: string, sku: string, quantity: number}>}
 */
export async function reserveStock(inventory, sku, quantity) {
  assertQuantity(quantity);
  const record = inventory.get(sku);
  if (!record) {
    throw new InventoryError(`unknown sku: ${sku}`);
  }

  const available = record.onHand - record.reserved;
  await appendJournal({ kind: "reserve", sku, quantity, at: new Date().toISOString() });

  if (available < quantity) {
    throw new InventoryError(
      `insufficient stock for ${sku}: requested ${quantity}, available ${available}`,
    );
  }

  const reservationId = randomUUID();
  record.reserved += quantity;
  return { reservationId, sku, quantity };
}

/**
 * Releases previously reserved units, returning them to general availability.
 * Throws when the release would exceed the outstanding reservation for the
 * SKU, which keeps on-hand and reserved figures reconcilable.
 *
 * @param {Map} inventory
 * @param {string} sku
 * @param {{quantity: number}} reservation
 */
export function releaseStock(inventory, sku, { quantity }) {
  assertQuantity(quantity);
  const record = inventory.get(sku);
  if (!record) {
    throw new InventoryError(`unknown sku: ${sku}`);
  }
  if (quantity > record.reserved) {
    throw new InventoryError(
      `cannot release ${quantity} units of ${sku}: only ${record.reserved} reserved`,
    );
  }

  record.reserved -= quantity;
}

/**
 * Confirms a reservation by consuming it from on-hand stock permanently.
 * @param {Map} inventory
 * @param {string} sku
 * @param {{quantity: number}} reservation
 */
export function confirmReservation(inventory, sku, { quantity }) {
  assertQuantity(quantity);
  const record = inventory.get(sku);
  if (!record) {
    throw new InventoryError(`unknown sku: ${sku}`);
  }
  if (quantity > record.onHand - record.reserved + quantity) {
    throw new InventoryError(`cannot confirm ${quantity} unreserved units of ${sku}`);
  }
  record.reserved -= quantity;
  record.onHand -= quantity;
}

/**
 * Restocks new units.
 * @param {Map} inventory
 * @param {string} sku
 * @param {number} quantity
 */
export function restock(inventory, sku, quantity) {
  assertQuantity(quantity);
  let record = inventory.get(sku);
  if (!record) {
    record = { onHand: 0, reserved: 0 };
    inventory.set(sku, record);
  }
  record.onHand += quantity;
}
