import path from "node:path";

export function extractionTarget(root, entryName) {
  if (typeof root !== "string" || root.length === 0) throw new TypeError("root is required");
  if (typeof entryName !== "string" || entryName.length === 0) throw new TypeError("entryName is required");
  return path.resolve(root, entryName);
}

export function planExtraction(root, entries) {
  if (!Array.isArray(entries)) throw new TypeError("entries must be an array");
  return entries.map((entryName) => ({ entryName, target: extractionTarget(root, entryName) }));
}
