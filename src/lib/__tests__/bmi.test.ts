/// <reference types="jest" />

import { bmi, bmiCategory } from "@/lib/bmi";

test("calculates BMI to one decimal place", () => {
  expect(bmi(65.5, 180)).toBe(20.2);
});

test("returns null when height is missing", () => {
  expect(bmi(65.5, null)).toBeNull();
});

test("categorizes normal BMI", () => {
  expect(bmiCategory(20.2)).toBe("Normal");
});
