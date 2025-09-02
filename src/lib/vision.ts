// path: src/lib/vision.ts
import { getGemini } from "@/lib/gemini";
import { parseItemsFromText, ParsedItem } from "@/lib/parse";

type VisionResult = {
  rawText: string;
  items: ParsedItem[];
  source: "gemini" | "tesseract";
  notes?: string;
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

export async function analyzeMealImage(
  bytes: Buffer,
  mime: string
): Promise<VisionResult> {
  const gemini = getGemini();

  // --- Prefer Google Gemini Vision ---
  if (gemini) {
    const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `You are a nutrition extractor for Indian meals.
Return STRICT JSON ONLY in this exact shape (no prose, no markdown):
{"items":[{"name":"Chapati","qty":2,"unit":"piece"},{"name":"Dal","qty":150,"unit":"g"}],"notes":"optional"}

Rules:
- "unit" must be exactly "g" or "piece".
- Whole items like roti/chapati/idli/dosa/egg → "piece".
- Curries/rice/dal/yogurt → estimate grams ("g") if visible.
- If unsure, set qty=1 and unit="piece".
- Output must be valid JSON and nothing else.`;

    const base64 = bytes.toString("base64");
    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { data: base64, mimeType: mime } } as any,
    ]);

    const text = result.response.text() ?? "";
    const items = safeParseItems(text) ?? parseItemsFromText(text);
    return { rawText: text, items, source: "gemini" };
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
