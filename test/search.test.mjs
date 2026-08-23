import test from "node:test";
import assert from "node:assert/strict";
import { searchEntries, SearchError, searchTitles, tokenize } from "../src/search.mjs";

const CATALOG = [
  { title: "Ceramic Pour-Over Kettle", keywords: ["coffee", "kitchen"] },
  { title: "Stainless Steel Travel Mug", keywords: ["drinkware", "commute"] },
  { title: "Goose-Neck Kettle Pro", keywords: ["coffee", "brewing"] },
];

test("tokenize lowercases and splits on spaces", () => {
  assert.deepEqual(tokenize("Steel Mug"), ["steel", "mug"]);
  assert.deepEqual(tokenize("single"), ["single"]);
});

test("tokenize requires a string query", () => {
  assert.throws(() => tokenize(null), SearchError);
});

test("searchEntries finds title matches", () => {
  const results = searchEntries(CATALOG, "kettle");
  assert.equal(results.length, 2);
  assert.ok(results.every((entry) => entry.title.toLowerCase().includes("kettle")));
});

test("searchEntries falls back to keyword matches", () => {
  const results = searchEntries(CATALOG, "drinkware");
  assert.deepEqual(results.map((entry) => entry.title), ["Stainless Steel Travel Mug"]);
});

test("searchEntries omits entries with no matching token", () => {
  const results = searchEntries(CATALOG, "espresso");
  assert.deepEqual(results, []);
});

test("searchEntries returns every match for multi-token queries", () => {
  const results = searchEntries(CATALOG, "kettle brewing");
  assert.ok(results.some((entry) => entry.title === "Ceramic Pour-Over Kettle"));
  assert.ok(results.some((entry) => entry.title === "Goose-Neck Kettle Pro"));
});

test("searchTitles maps results back to titles", () => {
  assert.deepEqual(searchTitles(CATALOG, "mug"), ["Stainless Steel Travel Mug"]);
});
