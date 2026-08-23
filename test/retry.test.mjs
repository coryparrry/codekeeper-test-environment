import test from "node:test";
import assert from "node:assert/strict";
import { asNonRetryable, NonRetryableError, retry } from "../src/retry.mjs";

const noopSleep = () => Promise.resolve();

test("retry returns the first successful result", async () => {
  let attempts = 0;
  const result = await retry(
    (attempt) => {
      attempts = attempt;
      if (attempt < 3) throw new Error("transient");
      return "ok";
    },
    { attempts: 5, sleep: noopSleep },
  );
  assert.equal(result, "ok");
  assert.equal(attempts, 3);
});

test("retry surfaces the last error once attempts are exhausted", async () => {
  const failure = new Error("always failing");
  await assert.rejects(
    () =>
      retry(
        () => {
          throw failure;
        },
        { attempts: 3, sleep: noopSleep },
      ),
    (error) => error === failure,
  );
});

test("retry validates its options", async () => {
  await assert.rejects(() => retry(() => {}, { attempts: 0 }), RangeError);
  await assert.rejects(() => retry(() => {}, { delayMs: -1 }), RangeError);
});

test("asNonRetryable wraps errors with a permanent marker", async () => {
  const original = new Error("card declined");
  const wrapped = asNonRetryable(original);
  assert.ok(wrapped instanceof NonRetryableError);
  assert.equal(wrapped.retryable, false);
  assert.equal(wrapped.message, "card declined");
});
