/**
 * Public surface of the storefront toolkit. Import from here so internal
 * files can be reorganized without breaking consumers.
 */

export {
  MoneyError,
  isValidAmount,
  dollarsToCents,
  centsToDollars,
  formatCents,
  applyTax,
  applyDiscount,
  splitEvenly,
  percentOf,
  sumCents,
} from "./money.mjs";

export {
  CartError,
  MAX_LINE_QUANTITY,
  createCart,
  addItem,
  removeLine,
  findItem,
  cartQuantity,
  subtotal,
  applyDiscounts,
  snapshotItems,
} from "./cart.mjs";

export {
  InventoryError,
  createInventory,
  availableUnits,
  reserveStock,
  releaseStock,
  confirmReservation,
  restock,
} from "./inventory.mjs";

export {
  OrderError,
  ORDER_STATES,
  createOrder,
  canTransition,
  transitionTo,
  refundTotal,
  sortByMostRecent,
  groupByStatus,
} from "./orders.mjs";

export {
  DateError,
  parseISODate,
  formatISODate,
  addDays,
  isBusinessDay,
  addBusinessDays,
  countBusinessDays,
  endOfDay,
} from "./business-days.mjs";

export { PaginationError, totalPages, paginate, pages } from "./pagination.mjs";

export {
  ValidationError,
  isValidEmail,
  normalizeSku,
  sameSku,
  isValidZipCode,
  isValidPhoneNumber,
  requireQuantity,
} from "./validation.mjs";

export { NonRetryableError, retry, asNonRetryable } from "./retry.mjs";

export { SearchError, tokenize, searchEntries, searchTitles } from "./search.mjs";
