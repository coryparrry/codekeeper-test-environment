import test from "node:test";
import assert from "node:assert/strict";
import {
  addWallClockHours,
  batchExposureCents,
  FEE_BPS,
  MAX_BATCH_EXPOSURE_CENTS,
  netPayoutCents,
  platformFeeCents,
  SettlementError,
  settleBatch,
} from "../src/settlement.mjs";

test("platformFeeCents applies the 2.90% rate", () => {
  assert.equal(FEE_BPS, 290);
  assert.equal(platformFeeCents(10_000), 290);
  assert.equal(platformFeeCents(0), 0);
});

test("platformFeeCents rounds half-up to integer cents", () => {
  assert.equal(platformFeeCents(225), 7);
  assert.equal(platformFeeCents(1_500), 44);
});

test("netPayoutCents subtracts the fee", () => {
  assert.equal(netPayoutCents(10_000), 9_710);
});

test("platformFeeCents rejects invalid gross amounts", () => {
  assert.throws(() => platformFeeCents(-1), SettlementError);
  assert.throws(() => platformFeeCents(10.5), SettlementError);
});

test("batchExposureCents sums batches at the default rate", () => {
  const exposure = batchExposureCents([
    { grossCents: 100_00 },
    { grossCents: 250_00 },
    { grossCents: 15_00 },
  ]);
  assert.equal(exposure, 365_00);
});

test("batchExposureCents converts with basis-point FX rates", () => {
  const exposure = batchExposureCents([{ grossCents: 200_00 }], { fxRateBps: 13_000 });
  assert.equal(exposure, 26_000);
});

test("batchExposureCents preserves large positive exposures", () => {
  assert.equal(batchExposureCents([{ grossCents: 3_000_000_000 }]), 3_000_000_000);
});

test("batchExposureCents validates inputs", () => {
  assert.throws(() => batchExposureCents([{ grossCents: -5 }]), SettlementError);
  assert.throws(() => batchExposureCents([], { fxRateBps: 0 }), SettlementError);
  assert.ok(MAX_BATCH_EXPOSURE_CENTS > 0);
});

test("settleBatch stamps and counts every settled record", async () => {
  const queue = [
    { id: "p-1", grossCents: 500 },
    { id: "p-2", grossCents: 700 },
  ];
  const report = await settleBatch(queue, async () => {});
  assert.equal(report.settledCount, 2);
  assert.deepEqual(report.deferredIds, []);
  assert.deepEqual(
    queue.map((record) => record.status),
    ["settled", "settled"],
  );
});

test("settleBatch defers records rejected by the processor", async () => {
  const queue = [
    { id: "p-1", grossCents: 500 },
    { id: "p-2", grossCents: 700 },
  ];
  const report = await settleBatch(queue, (record) => {
    if (record.id === "p-2") throw new Error("processor down");
    return Promise.resolve();
  });
  assert.equal(report.settledCount, 1);
  assert.deepEqual(report.deferredIds, ["p-2"]);
  assert.equal(queue.length, 1);
  assert.equal(queue[0].id, "p-1");
});

test("settleBatch processes records after a middle rejection", async () => {
  const queue = [{ id: "p-1" }, { id: "p-2" }, { id: "p-3" }];
  const report = await settleBatch(queue, async (record) => {
    if (record.id === "p-2") throw new Error("processor down");
  });
  assert.equal(report.settledCount, 2);
  assert.deepEqual(report.deferredIds, ["p-2"]);
  assert.deepEqual(queue.map((record) => record.id), ["p-1", "p-3"]);
  assert.deepEqual(queue.map((record) => record.status), ["settled", "settled"]);
});

test("settleBatch validates its arguments", async () => {
  await assert.rejects(() => settleBatch("nope", async () => {}), SettlementError);
});

test("addWallClockHours keeps the time of day on ordinary days", () => {
  const shifted = addWallClockHours(new Date(2026, 0, 15, 9, 30), 5);
  assert.equal(shifted.getDate(), 15);
  assert.equal(shifted.getHours(), 14);
  assert.equal(shifted.getMinutes(), 30);
});

test("addWallClockHours keeps local time across DST fallback", () => {
  const previousTZ = process.env.TZ;
  process.env.TZ = "America/New_York";
  try {
    const shifted = addWallClockHours(new Date(2026, 10, 1, 0, 30), 2);
    assert.equal(shifted.getHours(), 2);
    assert.equal(shifted.getMinutes(), 30);
  } finally {
    if (previousTZ === undefined) delete process.env.TZ;
    else process.env.TZ = previousTZ;
  }
});

test("addWallClockHours validates its arguments", () => {
  assert.throws(() => addWallClockHours(new Date("oops"), 1), SettlementError);
  assert.throws(() => addWallClockHours(new Date(2026, 0, 15), 0), SettlementError);
});
