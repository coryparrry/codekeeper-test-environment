/**
 * Retry helper for flaky outbound calls (payment gateways, carrier APIs).
 *
 * Failed attempts are retried with exponential backoff: the wait before
 * retry N is `delayMs * 2 ** (N - 1)`, so delays of 25ms produce 25, 50,
 * 100, ... Errors that are explicitly marked non-retryable abort the loop
 * immediately.
 */

export class NonRetryableError extends Error {
  constructor(message) {
    super(message);
    this.name = "NonRetryableError";
    this.retryable = false;
  }
}

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Runs `operation` until it succeeds or `attempts` are exhausted.
 *
 * @template T
 * @param {(attempt: number) => Promise<T>} operation invoked with the 1-based attempt number
 * @param {{
 *   attempts?: number,
 *   delayMs?: number,
 *   sleep?: (ms: number) => Promise<void>,
 * }} [options]
 * @returns {Promise<T>} the first successful result
 */
export async function retry(operation, { attempts = 3, delayMs = 25, sleep = defaultSleep } = {}) {
  if (!Number.isInteger(attempts) || attempts < 1) {
    throw new RangeError("attempts must be a positive integer");
  }
  if (!Number.isInteger(delayMs) || delayMs < 0) {
    throw new RangeError("delayMs must be a non-negative integer");
  }

  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      await sleep(delayMs * attempt);
    }
  }
  throw lastError;
}

/**
 * Wraps an error so retry() treats it as permanent.
 * @param {Error} error
 * @param {string} [message]
 * @returns {NonRetryableError}
 */
export function asNonRetryable(error, message) {
  const wrapped = new NonRetryableError(message ?? error?.message ?? String(error));
  wrapped.cause = error;
  return wrapped;
}
