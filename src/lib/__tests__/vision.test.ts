/// <reference types="jest" />

import { parseGeminiMealEstimate } from "@/lib/vision";

test("parses Gemini meal macro estimates", () => {
  const parsed = parseGeminiMealEstimate(
    JSON.stringify({
      items: [
        {
          name: "Fried chicken",
          qty: 2,
          unit: "piece",
          calories: 520,
          protein: 42,
          carbs: 18,
          fat: 31,
          confidence: 0.7,
        },
      ],
      notes: "Estimated from visible portion.",
    }),
  );

  expect(parsed?.items).toHaveLength(1);
  expect(parsed?.items[0].name).toBe("Fried chicken");
  expect(parsed?.total.calories).toBe(520);
  expect(parsed?.total.protein).toBe(42);
});

test("rejects Gemini meal estimates without macros", () => {
  const parsed = parseGeminiMealEstimate(
    JSON.stringify({
      items: [{ name: "Fried chicken", qty: 2, unit: "piece" }],
    }),
  );

  expect(parsed).toBeNull();
});
