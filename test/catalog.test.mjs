import test from "node:test";
import assert from "node:assert/strict";
import { createCatalog, materializeCart } from "../src/catalog.mjs";

test("catalog materializes immutable pricing data into cart lines", () => {
  const catalog = createCatalog([
    { sku: "book", unitPrice: 12.5, taxCategory: "reduced" },
  ]);

  assert.deepEqual(materializeCart([{ sku: "book", quantity: 2 }], catalog), [
    {
      sku: "book",
      unitPrice: 12.5,
      quantity: 2,
      discountPercent: 0,
      taxCategory: "reduced",
    },
  ]);
  assert.equal(Object.isFrozen(catalog.get("book")), true);
});

test("catalog rejects duplicate and unknown skus", () => {
  assert.throws(
    () =>
      createCatalog([
        { sku: "same", unitPrice: 1, taxCategory: "standard" },
        { sku: "same", unitPrice: 2, taxCategory: "standard" },
      ]),
    /duplicate/,
  );
  const catalog = createCatalog([
    { sku: "known", unitPrice: 1, taxCategory: "standard" },
  ]);
  assert.throws(
    () => materializeCart([{ sku: "missing", quantity: 1 }], catalog),
    /unknown/,
  );
});
