import test from "node:test";
import assert from "node:assert/strict";
import {
  isValidEmail,
  isValidPhoneNumber,
  isValidZipCode,
  normalizeSku,
  requireQuantity,
  sameSku,
  ValidationError,
} from "../src/validation.mjs";

test("isValidEmail accepts ordinary addresses", () => {
  assert.equal(isValidEmail("ada@example.com"), true);
  assert.equal(isValidEmail("ada.lovelace+orders@mail.example.co"), true);
});

test("isValidEmail rejects non-strings and malformed addresses", () => {
  assert.equal(isValidEmail(undefined), false);
  assert.equal(isValidEmail(42), false);
  assert.equal(isValidEmail(""), false);
  assert.equal(isValidEmail("not-an-email"), false);
  assert.equal(isValidEmail("missing-tld@example"), false);
});

test("normalizeSku canonicalizes case and separators", () => {
  assert.equal(normalizeSku(" ab-01 "), "AB01");
  assert.equal(normalizeSku("AB_01"), "AB01");
  assert.equal(normalizeSku("ab01"), "AB01");
});

test("normalizeSku requires a string", () => {
  assert.throws(() => normalizeSku(1234), ValidationError);
});

test("sameSku compares normalized keys", () => {
  assert.equal(sameSku("ab-1", "AB1"), true);
  assert.equal(sameSku("AB-1", "CD-2"), false);
});

test("isValidZipCode accepts five and nine digit forms", () => {
  assert.equal(isValidZipCode("94107"), true);
  assert.equal(isValidZipCode("94107-1234"), true);
  assert.equal(isValidZipCode("9410"), false);
  assert.equal(isValidZipCode("941071234"), false);
  assert.equal(isValidZipCode("abcde"), false);
});

test("isValidPhoneNumber enforces E.164 shapes", () => {
  assert.equal(isValidPhoneNumber("+14155551234"), true);
  assert.equal(isValidPhoneNumber("+442071838750"), true);
  assert.equal(isValidPhoneNumber("14155551234"), false);
  assert.equal(isValidPhoneNumber("+1 415 555 1234"), false);
});

test("requireQuantity passes through positive integers", () => {
  assert.equal(requireQuantity(3), 3);
  assert.throws(() => requireQuantity(0), ValidationError);
  assert.throws(() => requireQuantity(2.5), ValidationError);
});
