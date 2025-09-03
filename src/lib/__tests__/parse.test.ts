/// <reference types="jest" />

import { parseItemsFromText } from "@/lib/parse";

export {};

test("parses chapati/dal/curd line", () => {
  const items = parseItemsFromText("2 chapati, dal 150g, curd 100g");
  expect(Array.isArray(items)).toBe(true);
  expect(items.length).toBeGreaterThan(0);
});
