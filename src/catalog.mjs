const TAX_CATEGORIES = new Set(["standard", "reduced", "exempt"]);

function validateCatalogEntry(entry) {
  if (!entry || typeof entry !== "object") {
    throw new TypeError("catalog entry must be an object");
  }
  if (typeof entry.sku !== "string" || entry.sku.trim() === "") {
    throw new TypeError("catalog sku is required");
  }
  if (!Number.isFinite(entry.unitPrice) || entry.unitPrice < 0) {
    throw new TypeError("catalog unit price must be non-negative");
  }
  if (!TAX_CATEGORIES.has(entry.taxCategory)) {
    throw new TypeError("catalog tax category is invalid");
  }
}

export function createCatalog(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new TypeError("catalog requires at least one entry");
  }

  const catalog = new Map();
  for (const entry of entries) {
    validateCatalogEntry(entry);
    if (catalog.has(entry.sku)) {
      throw new TypeError(`duplicate catalog sku: ${entry.sku}`);
    }
    catalog.set(entry.sku, Object.freeze({ ...entry }));
  }
  return catalog;
}

export function materializeCart(cart, catalog) {
  if (!Array.isArray(cart) || cart.length === 0) {
    throw new TypeError("cart requires at least one item");
  }
  if (!(catalog instanceof Map)) {
    throw new TypeError("catalog must be created with createCatalog");
  }

  return cart.map((item) => {
    if (!item || typeof item !== "object") {
      throw new TypeError("cart item must be an object");
    }
    if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0) {
      throw new TypeError("quantity must be a positive integer");
    }
    const entry = catalog.get(item.sku);
    if (!entry) {
      throw new TypeError(`unknown catalog sku: ${item.sku}`);
    }

    return {
      sku: entry.sku,
      unitPrice: entry.unitPrice,
      quantity: item.quantity,
      discountPercent: item.discountPercent ?? 0,
      taxCategory: entry.taxCategory,
    };
  });
}
