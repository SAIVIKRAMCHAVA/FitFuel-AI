// path: src/lib/vision.ts
import { getGemini, runWithGeminiModelFallback } from "@/lib/gemini";
import { sumMacros, type Macro } from "@/lib/nutrition";
import { parseItemsFromText, ParsedItem } from "@/lib/parse";

export type EstimatedMealItem = ParsedItem & {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence?: number;
  notes?: string;
};

type VisionResult = {
  rawText: string;
  items: ParsedItem[];
  estimatedItems?: EstimatedMealItem[];
  total?: Macro;
  source: "gemini" | "tesseract";
  notes?: string;
  modelUsed?: string;
};

function safeParseItems(jsonText: string): ParsedItem[] | null {
  try {
    const obj = JSON.parse(jsonText);
    if (Array.isArray(obj?.items)) return obj.items as ParsedItem[];
  } catch {}
  const m = jsonText.match(/\{[\s\S]*\}/);
  if (m) {
    try {
      const obj = JSON.parse(m[0]);
      if (Array.isArray(obj?.items)) return obj.items as ParsedItem[];
    } catch {}
  }
  return null;
}

function toNumber(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function roundMacro(value: number) {
  return +value.toFixed(1);
}

export function parseGeminiMealEstimate(jsonText: string): {
  items: EstimatedMealItem[];
  total: Macro;
  notes?: string;
} | null {
  const candidates = [jsonText];
  const match = jsonText.match(/\{[\s\S]*\}/);
  if (match) candidates.push(match[0]);

  for (const candidate of candidates) {
    try {
      const obj = JSON.parse(candidate);
      if (!Array.isArray(obj?.items)) continue;

      const rawItems = obj.items as Record<string, unknown>[];
      const items: EstimatedMealItem[] = rawItems
        .map((item: Record<string, unknown>) => {
          const name = String(item?.name ?? "").trim();
          const qty = toNumber(item?.qty);
          const unit = item?.unit === "g" ? "g" : "piece";
          const calories = toNumber(item?.calories);
          const protein = toNumber(item?.protein);
          const carbs = toNumber(item?.carbs);
          const fat = toNumber(item?.fat);
          const confidence = toNumber(item?.confidence);
          const notes = String(item?.notes ?? "").trim();

          if (
            !name ||
            qty === null ||
            qty <= 0 ||
            calories === null ||
            protein === null ||
            carbs === null ||
            fat === null ||
            calories < 0 ||
            protein < 0 ||
            carbs < 0 ||
            fat < 0
          ) {
            return null;
          }

          return {
            name,
            qty: roundMacro(qty),
            unit,
            calories: Math.round(calories),
            protein: roundMacro(protein),
            carbs: roundMacro(carbs),
            fat: roundMacro(fat),
            ...(confidence !== null
              ? { confidence: Math.max(0, Math.min(1, roundMacro(confidence))) }
              : {}),
            ...(notes ? { notes } : {}),
          };
        })
        .filter((item): item is EstimatedMealItem => Boolean(item));

      if (items.length === 0) continue;

      const total = sumMacros(items);
      return {
        items,
        total: {
          calories: Math.round(total.calories),
          protein: roundMacro(total.protein),
          carbs: roundMacro(total.carbs),
          fat: roundMacro(total.fat),
        },
        notes: typeof obj?.notes === "string" ? obj.notes : undefined,
      };
    } catch {}
  }

  return null;
}

export async function analyzeMealImage(
  bytes: Buffer,
  mime: string,
): Promise<VisionResult> {
  // --- Prefer Google Gemini Vision ---
  if (getGemini()) {
    try {
      const prompt = `You are a nutrition estimator for Indian meals.
Return STRICT JSON ONLY in this exact shape (no prose, no markdown):
{"items":[{"name":"Chapati","qty":2,"unit":"piece","calories":240,"protein":6.2,"carbs":36,"fat":6.4,"confidence":0.75},{"name":"Dal","qty":150,"unit":"g","calories":177,"protein":11.4,"carbs":27,"fat":2.3,"confidence":0.65}],"notes":"optional"}

Rules:
- "unit" must be exactly "g" or "piece".
- Whole items like roti/chapati/idli/dosa/egg -> "piece".
- Curries/rice/dal/yogurt -> estimate grams ("g") if visible.
- Estimate calories, protein, carbs, and fat for the visible portion of each item.
- Macros must be for the estimated qty shown, not per 100g.
- Use typical Indian home/restaurant preparation assumptions when exact ingredients are unknown.
- confidence must be between 0 and 1.
- If unsure, still give your best estimate and lower confidence.
- Output must be valid JSON and nothing else.`;

      const base64 = bytes.toString("base64");
      const { result, modelName } = await runWithGeminiModelFallback(
        ({ model }) =>
          model.generateContent([
            { text: prompt },
            { inlineData: { data: base64, mimeType: mime } } as any,
          ]),
      );

      const text = result.response.text() ?? "";
      const estimated = parseGeminiMealEstimate(text);
      if (estimated) {
        return {
          rawText: text,
          items: estimated.items,
          estimatedItems: estimated.items,
          total: estimated.total,
          source: "gemini",
          notes: estimated.notes,
          modelUsed: modelName,
        };
      }

      const items = safeParseItems(text) ?? parseItemsFromText(text);
      if (items.length > 0) {
        return {
          rawText: text,
          items,
          source: "gemini",
          notes: "Gemini returned items without usable macro estimates.",
          modelUsed: modelName,
        };
      }

      throw new Error("Gemini did not return usable meal items.");
    } catch (error) {
      console.error("Gemini image analysis failed; using OCR fallback.", error);
    }
  }

  // --- Fallback: Tesseract OCR ---
  const t = await import("tesseract.js");
  // @ts-ignore types vary
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker();
  await worker.reinitialize("eng"); // <-- new API (v5+)
  const { data } = await worker.recognize(bytes);
  await worker.terminate();

  const raw = data?.text || "";
  const items = parseItemsFromText(raw);
  return { rawText: raw, items, source: "tesseract" };
}
