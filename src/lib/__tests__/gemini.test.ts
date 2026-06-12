/// <reference types="jest" />

import {
  DEFAULT_GEMINI_MODEL,
  FALLBACK_GEMINI_MODELS,
  getGeminiModelName,
  getGeminiModelNames,
} from "@/lib/gemini";

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

test("deduplicates configured and fallback model names", () => {
  process.env.GEMINI_MODEL = FALLBACK_GEMINI_MODELS[0];

  expect(getGeminiModelNames()).toEqual([
    FALLBACK_GEMINI_MODELS[0],
    DEFAULT_GEMINI_MODEL,
    ...FALLBACK_GEMINI_MODELS.slice(1),
  ]);
});
