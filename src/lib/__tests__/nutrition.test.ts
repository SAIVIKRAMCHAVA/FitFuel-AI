/// <reference types="jest" />

import { mapItemsToMacros } from "@/lib/nutrition";

export {};

// Mock prisma used inside nutrition mapping (if nutrition.ts imports prisma)
jest.mock("@/lib/db", () => {
  const foodItem = [
    {
      name: "Chapati",
      calories: 120,
      protein: 3.5,
      carbs: 18,
      fat: 3,
      unit: "per_piece",
    },
    {
      name: "Dal (Lentil Curry)",
      calories: 120,
      protein: 7,
      carbs: 18,
      fat: 2,
      unit: "per_100g",
    },
    {
      name: "Curd (Dahi)",
      calories: 98,
      protein: 5,
      carbs: 7,
      fat: 5,
      unit: "per_100g",
    },
  ];
  return { prisma: { foodItem: { findMany: async () => foodItem } } };
});

test("maps basic Indian meal to non-zero macros", async () => {
  const { total } = await mapItemsToMacros([
    { name: "chapati", qty: 2, unit: "piece" },
    { name: "dal", qty: 150, unit: "g" },
    { name: "curd", qty: 100, unit: "g" },
  ]);

  expect(total.calories).toBeGreaterThan(0);
  expect(total.protein).toBeGreaterThan(0);
  expect(total.carbs).toBeGreaterThan(0);
});
