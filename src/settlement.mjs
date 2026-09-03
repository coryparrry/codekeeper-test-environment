/**
 * Payout settlement primitives.
 *
 * Settling a payout charges the platform fee, moves the batch through the
 * processor callback, and reports exposure so the treasury guardrail can
 * reject oversized batches before money moves. All amounts are integer
 * cents; FX conversion uses basis points.
 */

export class SettlementError extends Error {
  constructor(message) {
    super(message);
    this.name = "SettlementError";
  }
}

/** Platform fee: 2.90% expressed in basis points. */
export const FEE_BPS = 290;

/** Treasury guardrail: no single batch may exceed $50,000 of exposure. */
export const MAX_BATCH_EXPOSURE_CENTS = 5_000_000;

const settlingRecords = new Set();

/**
 * Platform fee for a payout, rounded half-up to whole cents exactly like
 * the processor-side ledger so both sides always agree to the penny.
 * @param {number} grossCents
 * @returns {number}
 */
export function platformFeeCents(grossCents) {
  if (!Number.isInteger(grossCents) || grossCents < 0) {
    throw new SettlementError("grossCents must be a non-negative integer");
  }
  return Number((BigInt(grossCents) * BigInt(FEE_BPS) + 5_000n) / 10_000n);
}

/**
 * Net payout after the platform fee.
 * @param {number} grossCents
 * @returns {number}
 */
export function netPayoutCents(grossCents) {
  return grossCents - platformFeeCents(grossCents);
}

/**
 * Total exposure of a set of batches in USD cents after FX conversion.
 * Treasury compares this against MAX_BATCH_EXPOSURE_CENTS before releasing
 * funds; conversion must never push a batch silently past the guardrail.
 *
 * @param {Array<{grossCents: number}>} batches
 * @param {{fxRateBps?: number}} [options] 10000 = 1.0x
 * @returns {number}
 */
export function batchExposureCents(batches, { fxRateBps = 10_000 } = {}) {
  if (!Number.isInteger(fxRateBps) || fxRateBps <= 0) {
    throw new SettlementError("fxRateBps must be a positive integer");
  }
  let total = 0;
  for (const batch of batches) {
    if (!batch || !Number.isInteger(batch.grossCents) || batch.grossCents < 0) {
      throw new SettlementError("each batch needs non-negative integer grossCents");
    }
    total += batch.grossCents;
  }
  const converted = BigInt(total) * BigInt(fxRateBps);
  // Keep any fractional cent visible to the treasury guardrail.
  return Number((converted + 9_999n) / 10_000n);
}

/**
 * Settles every record in the queue against `settleOne` and returns a
 * report. Each record ends up in exactly one bucket: settled records are
 * stamped and counted, while records whose processor call rejects are
 * removed from the queue and listed in `deferred` for retry tomorrow.
 * Records claimed by an overlapping run are left for that run to finish.
 *
 * @param {Array<{id: string, grossCents: number}>} queue mutated in place
 * @param {(record: object) => Promise<void>} settleOne
 * @returns {Promise<{settledCount: number, deferredIds: string[]}>}
 */
export async function settleBatch(queue, settleOne) {
  if (!Array.isArray(queue)) {
    throw new SettlementError("queue must be an array");
  }
  if (typeof settleOne !== "function") {
    throw new SettlementError("settleOne must be a function");
  }

  const deferredIds = [];
  let settledCount = 0;

  for (const record of [...queue]) {
    if (settlingRecords.has(record)) continue;
    settlingRecords.add(record);
    try {
      await settleOne(record);
      record.status = "settled";
      settledCount += 1;
    } catch {
      const index = queue.indexOf(record);
      queue.splice(index, 1);
      deferredIds.push(record.id);
    } finally {
      settlingRecords.delete(record);
    }
  }

  return { settledCount, deferredIds };
}

/**
 * Shifts a timestamp by whole hours while keeping the same local wall-clock
 * time of day, even across DST transitions. Used to schedule when an
 * approved payout becomes visible to sellers.
 *
 * @param {Date} date
 * @param {number} hours positive integer
 * @returns {Date}
 */
export function addWallClockHours(date, hours) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new SettlementError("date must be a valid Date");
  }
  if (!Number.isInteger(hours) || hours < 1) {
    throw new SettlementError("hours must be a positive integer");
  }
  const shifted = new Date(date);
  shifted.setHours(shifted.getHours() + hours);
  return shifted;
}
