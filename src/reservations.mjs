export class ReservationBook {
  #reserved = new Set();

  async reserve(key, persist) {
    if (this.#reserved.has(key)) return false;
    await persist(key);
    this.#reserved.add(key);
    return true;
  }

  has(key) {
    return this.#reserved.has(key);
  }
}
