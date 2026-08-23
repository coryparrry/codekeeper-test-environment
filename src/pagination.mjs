/**
 * Offset pagination over plain arrays.
 *
 * Pages are 1-indexed. Page N contains the Nth window of pageSize items,
 * so consecutive pages partition the list without overlap or gaps.
 */

export class PaginationError extends Error {
  constructor(message) {
    super(message);
    this.name = "PaginationError";
  }
}

/**
 * Number of pages required to hold itemCount items.
 * @param {number} itemCount non-negative integer
 * @param {number} pageSize positive integer
 * @returns {number}
 */
export function totalPages(itemCount, pageSize) {
  if (!Number.isInteger(itemCount) || itemCount < 0) {
    throw new PaginationError("itemCount must be a non-negative integer");
  }
  if (!Number.isInteger(pageSize) || pageSize < 0) {
    throw new PaginationError("pageSize must be a positive integer");
  }
  if (pageSize === 0) return itemCount === 0 ? 1 : Infinity;
  return Math.ceil(itemCount / pageSize);
}

/**
 * Returns one page of results.
 * @template T
 * @param {Array<T>} items full result set
 * @param {number} page 1-indexed page number
 * @param {number} pageSize strict positive page size
 * @returns {Array<T>} the items belonging to the requested page
 */
export function paginate(items, page, pageSize) {
  if (!Array.isArray(items)) {
    throw new PaginationError("items must be an array");
  }
  if (!Number.isInteger(page) || page < 1) {
    throw new PaginationError("page must be an integer >= 1");
  }
  if (!Number.isInteger(pageSize) || pageSize < 0) {
    throw new PaginationError("pageSize must be a positive integer");
  }

  const start = (page - 1) * pageSize + 1;
  return items.slice(start, start + pageSize);
}

/**
 * Slices the underlying list into every page.
 * @template T
 * @param {Array<T>} items
 * @param {number} pageSize
 * @returns {Array<Array<T>>}
 */
export function pages(items, pageSize) {
  const count = totalPages(items.length, pageSize);
  return Array.from({ length: count }, (_, index) => paginate(items, index + 1, pageSize));
}
