/// <reference types="jest" />

import { parseDateTimeLocal } from "@/lib/datetime";

test("parses datetime-local values as IST", () => {
  const parsed = parseDateTimeLocal("2026-06-10T13:00");
  expect(parsed.toISOString()).toBe("2026-06-10T07:30:00.000Z");
});

test("preserves values that already include a timezone", () => {
  const parsed = parseDateTimeLocal("2026-06-10T13:00:00.000Z");
  expect(parsed.toISOString()).toBe("2026-06-10T13:00:00.000Z");
});

test("returns fallback for invalid datetime input", () => {
  const fallback = new Date("2026-06-12T00:00:00.000Z");
  expect(parseDateTimeLocal("not-a-date", fallback)).toBe(fallback);
});
