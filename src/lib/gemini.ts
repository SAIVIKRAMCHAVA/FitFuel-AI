import { GoogleGenerativeAI } from "@google/generative-ai";

export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";

export function getGeminiModelName(model?: string) {
  return (
    model?.trim() || process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL
  );
}

export function getGemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenerativeAI(key);
}

export function getGeminiGenerativeModel(model?: string) {
  const gemini = getGemini();
  if (!gemini) return null;

  const modelName = getGeminiModelName(model);
  return {
    model: gemini.getGenerativeModel({ model: modelName }),
    modelName,
  };
}
