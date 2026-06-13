/// <reference types="jest" />

import { resolvePlanGoal } from "@/lib/plan";

test("uses written weight-loss goals before BMI defaults", () => {
  expect(resolvePlanGoal("I want to reduce weight", 20)).toBe("lose_slight");
});

test("uses written muscle or weight-gain goals before BMI defaults", () => {
  expect(resolvePlanGoal("put on weight and grow muscle", 27)).toBe(
    "gain_slight",
  );
});

test("falls back to BMI when no written goal is saved", () => {
  expect(resolvePlanGoal("", 17.5)).toBe("gain_slight");
  expect(resolvePlanGoal("", 26)).toBe("lose_slight");
  expect(resolvePlanGoal("", 22)).toBe("recomp");
});
