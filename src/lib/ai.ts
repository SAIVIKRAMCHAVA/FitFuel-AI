import { getGeminiGenerativeModel } from "@/lib/gemini";

export type AIJSONOptions = {
  system?: string;
  prompt: string;
  schema: any; // JSON schema object
  model?: string;
};

export async function aiJSON<T>({
  system,
  prompt,
  schema,
  model,
}: AIJSONOptions): Promise<{ json: T; modelUsed: string }> {
  const gemini = getGeminiGenerativeModel(model);
  if (!gemini) {
    throw new Error("GEMINI_API_KEY not set. Please add it to your env.");
  }
  const result = await gemini.model.generateContent({
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
  return { json: parsed as T, modelUsed: gemini.modelName };
}
