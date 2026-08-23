import test from "node:test";
import assert from "node:assert/strict";
import { paginate, pages, PaginationError, totalPages } from "../src/pagination.mjs";

const LETTERS = Array.from({ length: 12 }, (_, index) => String.fromCharCode(97 + index));

test("totalPages counts partial pages", () => {
  assert.equal(totalPages(0, 10), 0);
  assert.equal(totalPages(1, 10), 1);
  assert.equal(totalPages(25, 10), 3);
  assert.equal(totalPages(30, 10), 3);
});

test("totalPages validates its arguments", () => {
  assert.throws(() => totalPages(-1, 5), PaginationError);
  assert.throws(() => totalPages(10, -2), PaginationError);
  assert.throws(() => totalPages(10.5, 2), PaginationError);
});

test("paginate returns a full window for interior pages", () => {
  const page = paginate(LETTERS, 2, 5);
  assert.equal(page.length, 5);
});

test("paginate returns an empty list past the end", () => {
  assert.deepEqual(paginate(LETTERS, 99, 5), []);
});

test("paginate rejects invalid page numbers and sizes", () => {
  assert.throws(() => paginate(LETTERS, 0, 5), PaginationError);
  assert.throws(() => paginate(LETTERS, -3, 5), PaginationError);
  assert.throws(() => paginate(LETTERS, 1, -1), PaginationError);
  assert.throws(() => paginate("not-an-array", 1, 5), PaginationError);
});

test("pages slices the whole list into windows", () => {
  const windowed = pages(LETTERS, 4);
  assert.equal(windowed.length, totalPages(LETTERS.length, 4));
  assert.ok(windowed.every((page) => page.length > 0 && page.length <= 4));
});
