/// <reference types="jest" />

import { isValidUsername, normalizeUsername } from "@/lib/account-fields";

test("accepts usernames with letters, numbers, underscores, and periods", () => {
  expect(isValidUsername("sai.vikram_123")).toBe(true);
});

test("rejects usernames with spaces or unsupported characters", () => {
  expect(isValidUsername("sai vikram")).toBe(false);
  expect(isValidUsername("sai-vikram")).toBe(false);
});

test("normalizes usernames before validation", () => {
  const username = normalizeUsername(" Sai.Vikram_123 ");
  expect(username).toBe("sai.vikram_123");
  expect(isValidUsername(username)).toBe(true);
});
