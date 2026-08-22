export function buildListEventsRequest({ cursor = null, limit = 50 } = {}) {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw new RangeError("limit must be from 1 through 100");
  const query = new URLSearchParams({ limit: String(limit) });
  if (cursor !== null) query.set("pageToken", cursor);
  return `/v1/events?${query}`;
}
