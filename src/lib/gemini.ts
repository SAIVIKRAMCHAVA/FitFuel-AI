import { GoogleGenerativeAI } from "@google/generative-ai";

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
export const FALLBACK_GEMINI_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-3.5-flash",
];

type GeminiModel = ReturnType<GoogleGenerativeAI["getGenerativeModel"]>;
type GeminiModelAttempt = {
  model: GeminiModel;
  modelName: string;
};

export function getGeminiModelName(model?: string) {
  return (
    model?.trim() || process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL
  );
}

export function getGeminiModelNames(model?: string) {
  const configured = getGeminiModelName(model);
  return [configured, DEFAULT_GEMINI_MODEL, ...FALLBACK_GEMINI_MODELS].filter(
    (modelName, index, models) => models.indexOf(modelName) === index,
  );
}

export function getGemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenerativeAI(key);
}

export async function runWithGeminiModelFallback<T>(
  run: (attempt: GeminiModelAttempt) => Promise<T>,
  model?: string,
): Promise<{ result: T; modelName: string }> {
  const gemini = getGemini();
  if (!gemini) {
    throw new Error("GEMINI_API_KEY not set. Please add it to your env.");
  }

  let lastError: unknown;
  for (const modelName of getGeminiModelNames(model)) {
    try {
      const result = await run({
        model: gemini.getGenerativeModel({ model: modelName }),
        modelName,
      });
      return { result, modelName };
    } catch (error) {
      lastError = error;
      console.warn(`Gemini model ${modelName} failed; trying fallback.`, error);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Gemini request failed for every configured model.");
}
