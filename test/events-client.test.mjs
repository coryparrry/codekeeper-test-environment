import assert from "node:assert/strict";
import test from "node:test";
import { buildListEventsRequest } from "../src/events-client.mjs";

test("the first events request uses the bounded default page size", () => {
  assert.equal(buildListEventsRequest(), "/v1/events?limit=50");
  assert.equal(buildListEventsRequest({ limit: 10 }), "/v1/events?limit=10");
});

test("the public continuation cursor is preserved for the next page", () => {
  const request = buildListEventsRequest({ cursor: "after:event/42", limit: 25 });
  const url = new URL(request, "https://api.example.test");
  assert.equal(url.searchParams.get("cursor"), "after:event/42");
  assert.equal(url.searchParams.has("pageToken"), false);
});
