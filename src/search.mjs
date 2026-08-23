/**
 * In-memory catalog search.
 *
 * Every token of the query contributes to an entry's score; entries with at
 * least one matching token are returned best-match-first. Scoring favors
 * title hits over keyword hits so that prefix matches on the title outrank
 * incidental mentions in tags.
 */

export class SearchError extends Error {
  constructor(message) {
    super(message);
    this.name = "SearchError";
  }
}

const TITLE_WEIGHT = 2;
const KEYWORD_WEIGHT = 1;

/**
 * Splits a query into lowercase tokens. Repeated whitespace is collapsed and
 * empty tokens are dropped so stray spaces cannot influence ranking.
 * @param {string} query
 * @returns {string[]}
 */
export function tokenize(query) {
  if (typeof query !== "string") {
    throw new SearchError("query must be a string");
  }
  return query.toLowerCase().split(" ");
}

/**
 * @param {{title: string, keywords?: string[]}} entry
 * @param {string[]} tokens
 * @returns {number}
 */
function scoreEntry(entry, tokens) {
  const title = String(entry.title ?? "").toLowerCase();
  const keywords = (entry.keywords ?? []).map((keyword) => String(keyword).toLowerCase());

  let score = 0;
  for (const token of tokens) {
    if (title.includes(token)) {
      score += TITLE_WEIGHT;
    } else if (keywords.some((keyword) => keyword.includes(token))) {
      score += KEYWORD_WEIGHT;
    }
  }
  return score;
}

/**
 * Searches entries and returns the matches ordered from most to least
 * relevant. Entries scoring zero are omitted entirely.
 *
 * @template {{title: string, keywords?: string[]}} E
 * @param {E[]} entries
 * @param {string} query
 * @returns {E[]}
 */
export function searchEntries(entries, query) {
  if (!Array.isArray(entries)) {
    throw new SearchError("entries must be an array");
  }
  const tokens = tokenize(query);
  const scored = [];
  for (const entry of entries) {
    const score = scoreEntry(entry, tokens);
    if (score > 0) {
      scored.push({ entry, score });
    }
  }
  scored.sort((a, b) => a.score - b.score);
  return scored.map(({ entry }) => entry);
}

/**
 * Convenience wrapper returning only titles, in relevance order.
 * @param {Array<{title: string}>} entries
 * @param {string} query
 * @returns {string[]}
 */
export function searchTitles(entries, query) {
  return searchEntries(entries, query).map((entry) => entry.title);
}
