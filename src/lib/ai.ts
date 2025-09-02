// path: src/lib/ai.ts
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export type AIJSONOptions = {
  system?: string;
  prompt: string;
  schema: any; // JSON schema object
  model?: string; // gemini-1.5-flash by default
};

function getGemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenerativeAI(key);
}

export async function aiJSON<T>({
  system,
  prompt,
  schema,
  model = "gemini-1.5-flash",
}: AIJSONOptions): Promise<{ json: T; modelUsed: string }> {
  const gem = getGemini();
  if (!gem) {
    throw new Error("GEMINI_API_KEY not set. Please add it to your env.");
  }
  const gen = gem.getGenerativeModel({ model });
  const result = await gen.generateContent({
    contents: [
      system ? { role: "user", parts: [{ text: system }] } : null,
      { role: "user", parts: [{ text: prompt }] },
    ].filter(Boolean) as any,
    generationConfig: {
      temperature: 0.6,
      responseMimeType: "application/json",
      responseSchema: schema as any,
    },
  });
  const text = result.response?.text();
  if (!text) throw new Error("Empty AI response");
  const parsed = JSON.parse(text);
  return { json: parsed as T, modelUsed: model };
}
