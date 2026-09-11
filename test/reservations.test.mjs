import assert from "node:assert/strict";
import test from "node:test";
import { ReservationBook } from "../src/reservations.mjs";

test("a completed reservation rejects a later duplicate", async () => {
  const book = new ReservationBook();
  assert.equal(await book.reserve("sku-42", async () => {}), true);
  assert.equal(await book.reserve("sku-42", async () => {}), false);
});

test("overlapping reservation attempts allow exactly one winner", async () => {
  const book = new ReservationBook();
  let arrivals = 0;
  let release;
  const bothArrived = new Promise((resolve) => { release = resolve; });
  const persist = async () => {
    arrivals += 1;
    if (arrivals === 2) release();
    await bothArrived;
  };
  const results = await Promise.all([
    book.reserve("sku-42", persist),
    book.reserve("sku-42", persist),
  ]);
  assert.deepEqual(results.sort(), [false, true]);
  assert.equal(book.has("sku-42"), true);
});
