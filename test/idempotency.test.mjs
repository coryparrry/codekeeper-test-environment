import test from "node:test";
import assert from "node:assert/strict";
import {
  createIdempotencyStore,
  IdempotencyError,
  isValidKey,
  reserveKey,
  size,
} from "../src/idempotency.mjs";

const KEY = "idem_abcdefghijklmnopqrstuvwxyz";

test("isValidKey accepts well-formed keys", () => {
  assert.equal(isValidKey(KEY), true);
  assert.equal(isValidKey("idem_" + "a".repeat(64)), true);
});

test("isValidKey rejects malformed values", () => {
  assert.equal(isValidKey(undefined), false);
  assert.equal(isValidKey(""), false);
  assert.equal(isValidKey("checkout-1"), false);
  assert.equal(isValidKey("IDEM_abcdefghijklmnopqrstuvwx"), false);
  assert.equal(isValidKey("idem_short"), false);
});

test("reserveKey stores the first submission", () => {
  const store = createIdempotencyStore();
  const outcome = reserveKey(store, KEY, { result: { orderId: "o-1" }, now: 1_000 });
  assert.equal(outcome.replayed, false);
  assert.deepEqual(outcome.result, { orderId: "o-1" });
});

test("replays inside the TTL return the captured result", () => {
  const store = createIdempotencyStore();
  reserveKey(store, KEY, { result: { orderId: "o-1", total: 4200 }, now: 1_000 });
  const replay = reserveKey(store, KEY, { now: 60_000 });
  assert.equal(replay.replayed, true);
  assert.deepEqual(replay.result, { orderId: "o-1", total: 4200 });
});

test("expired entries are pruned and the key becomes reservable again", () => {
  const store = createIdempotencyStore({ ttlMs: 50 });
  reserveKey(store, KEY, { result: null, now: 1_000 });
  const fresh = reserveKey(store, KEY, { result: null, now: 1_200 });
  assert.equal(fresh.replayed, false);
});

test("the store evicts down to its capacity ceiling", () => {
  const store = createIdempotencyStore({ maxEntries: 2 });
  reserveKey(store, "idem_" + "a".repeat(26), { now: 1 });
  reserveKey(store, "idem_" + "b".repeat(26), { now: 2 });
  reserveKey(store, "idem_" + "c".repeat(26), { now: 3 });
  assert.ok(size(store) <= store.maxEntries);
});

test("store options and keys are validated", () => {
  assert.throws(() => createIdempotencyStore({ ttlMs: 0 }), IdempotencyError);
  assert.throws(() => createIdempotencyStore({ maxEntries: 0 }), IdempotencyError);
  assert.throws(
    () => reserveKey(createIdempotencyStore(), "not-a-key"),
    IdempotencyError,
  );
});
