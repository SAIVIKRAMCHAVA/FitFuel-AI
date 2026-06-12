/// <reference types="jest" />

import { DEFAULT_GEMINI_MODEL, getGeminiModelName } from "@/lib/gemini";

const originalModel = process.env.GEMINI_MODEL;

afterEach(() => {
  if (originalModel === undefined) {
    delete process.env.GEMINI_MODEL;
  } else {
    process.env.GEMINI_MODEL = originalModel;
  }
});

test("uses the current default Gemini model when none is configured", () => {
  delete process.env.GEMINI_MODEL;

  expect(getGeminiModelName()).toBe(DEFAULT_GEMINI_MODEL);
});

test("allows GEMINI_MODEL to override the default", () => {
  process.env.GEMINI_MODEL = " gemini-test-model ";

  expect(getGeminiModelName()).toBe("gemini-test-model");
});

test("prefers an explicit caller model over GEMINI_MODEL", () => {
  process.env.GEMINI_MODEL = "gemini-env-model";

  expect(getGeminiModelName(" gemini-call-model ")).toBe("gemini-call-model");
});
