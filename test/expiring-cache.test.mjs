import assert from "node:assert/strict";
import test from "node:test";
import { ExpiringCache } from "../src/expiring-cache.mjs";

test("cache values remain readable through their expiry timestamp", () => {
  let now = 1_000;
  const cache = new ExpiringCache(() => now);
  cache.set("session", "active", 500);
  now = 1_499;
  assert.equal(cache.get("session"), "active");
  now = 1_500;
  assert.equal(cache.get("session"), "active");
});

test("cache values expire after their expiry timestamp", () => {
  let now = 5_000;
  const cache = new ExpiringCache(() => now);
  cache.set("session", "active", 500);
  now = 5_501;
  assert.equal(cache.get("session"), undefined);
});
