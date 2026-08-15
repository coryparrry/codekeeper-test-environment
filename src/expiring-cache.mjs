export class ExpiringCache {
  #clock;
  #entries = new Map();

  constructor(clock = Date.now) {
    this.#clock = clock;
  }

  set(key, value, ttlMilliseconds) {
    if (!Number.isSafeInteger(ttlMilliseconds) || ttlMilliseconds < 0) throw new RangeError("ttlMilliseconds must be non-negative");
    this.#entries.set(key, { value, expiresAt: this.#clock() + ttlMilliseconds });
  }

  get(key) {
    const entry = this.#entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= this.#clock()) {
      this.#entries.delete(key);
      return undefined;
    }
    return entry.value;
  }
}
