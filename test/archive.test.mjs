import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { extractionTarget, planExtraction } from "../src/archive.mjs";

test("archive entries resolve below the extraction root", () => {
  const root = path.resolve("/srv/imports/job-42");
  assert.equal(extractionTarget(root, "images/cover.png"), path.join(root, "images/cover.png"));
  assert.deepEqual(planExtraction(root, ["a.txt", "nested/b.txt"]), [
    { entryName: "a.txt", target: path.join(root, "a.txt") },
    { entryName: "nested/b.txt", target: path.join(root, "nested/b.txt") },
  ]);
});

test("archive traversal cannot escape the extraction root", () => {
  const root = path.resolve("/srv/imports/job-42");
  assert.throws(() => extractionTarget(root, "../../etc/cron.d/payload"), /outside the extraction root/);
});
