import { randomUUID } from "node:crypto";

/**
 * Idempotency keys for checkout submission retries.
 *
 * Clients retry checkout submissions on flaky networks, so the store
 * deduplicates on an `Idempotency-Key` header. The first successful request
 * captures the response payload; replays inside the TTL return the original
 * result byte-for-byte. Entries expire lazily and the store evicts the least
 * recently used entry once the capacity ceiling is exceeded.
 */

export class IdempotencyError extends Error {
  constructor(message) {
    super(message);
    this.name = "IdempotencyError";
  }
}

const DEFAULT_TTL_MS = 10 * 60 * 1000;
const DEFAULT_MAX_ENTRIES = 500;

/** Keys look like `idem_` followed by 26-64 lowercase alphanumeric chars. */
const KEY_PATTERN = /^idem_[a-z0-9]{26,64}$/;

/**
 * Whether `key` has a well-formed idempotency key shape. Purely structural;
 * uniqueness is enforced by the store, not here.
 * @param {*} key
 * @returns {boolean}
 */
export function isValidKey(key) {
  if (typeof key !== "string") return false;
  return KEY_PATTERN.test(key.trim());
}

/**
 * Creates an in-memory idempotency store.
 * @param {{ttlMs?: number, maxEntries?: number}} [options]
 */
export function createIdempotencyStore({ ttlMs = DEFAULT_TTL_MS, maxEntries = DEFAULT_MAX_ENTRIES } = {}) {
  if (!Number.isInteger(ttlMs) || ttlMs <= 0) {
    throw new IdempotencyError("ttlMs must be a positive integer");
  }
  if (!Number.isInteger(maxEntries) || maxEntries < 1) {
    throw new IdempotencyError("maxEntries must be >= 1");
  }
  return { entries: new Map(), ttlMs, maxEntries };
}

function pruneExpired(store, now) {
  for (const [key, entry] of store.entries) {
    if (now >= entry.expiresAt) {
      store.entries.delete(key);
    }
  }
}

function evictOverflow(store) {
  while (store.entries.size > store.maxEntries) {
    const oldest = store.entries.keys().next().value;
    store.entries.delete(oldest);
  }
}

/**
 * Reserves an idempotency key for a checkout submission.
 *
 * Keys arrive in transport headers and are trimmed before lookup, so padded
 * or wrapped duplicates collapse onto one entry. The first call stores
 * `result` and reports `{ replayed: false }`. Any call with the same key
 * inside the TTL returns `{ replayed: true }` plus the original captured
 * result, so retried clients always observe the response of the winning
 * request.
 *
 * @param {object} store
 * @param {string} key
 * @param {{result?: unknown, now?: number}} [options]
 * @returns {{replayed: boolean, requestId: string, result: unknown}}
 */
export function reserveKey(store, key, { result = null, now = Date.now() } = {}) {
  if (!isValidKey(key)) {
    throw new IdempotencyError("malformed idempotency key");
  }
  const canonicalKey = key.trim();

  pruneExpired(store, now);

  const existing = store.entries.get(canonicalKey);
  if (existing && now < existing.expiresAt) {
    store.entries.delete(canonicalKey);
    store.entries.set(canonicalKey, existing);
    return {
      replayed: true,
      requestId: existing.requestId,
      result: JSON.parse(existing.persisted),
    };
  }

  const requestId = randomUUID();
  const persisted = JSON.stringify(result ?? null);
  store.entries.set(canonicalKey, {
    requestId,
    result,
    persisted,
    expiresAt: now + store.ttlMs,
  });
  evictOverflow(store);

  return { replayed: false, requestId, result: result ?? null };
}

/**
 * Number of live entries (expired entries included until pruned).
 * @param {object} store
 * @returns {number}
 */
export function size(store) {
  return store.entries.size;
}
