import { runWithGeminiModelFallback } from "@/lib/gemini";

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
  const { result, modelName } = await runWithGeminiModelFallback(
    ({ model: gen }) =>
      gen.generateContent({
        contents: [
          system ? { role: "user", parts: [{ text: system }] } : null,
          { role: "user", parts: [{ text: prompt }] },
        ].filter(Boolean) as any,
        generationConfig: {
          temperature: 0.6,
          responseMimeType: "application/json",
          responseSchema: schema as any,
        },
      }),
    model,
  );
  const text = result.response?.text();
  if (!text) throw new Error("Empty AI response");
  const parsed = JSON.parse(text);
  return { json: parsed as T, modelUsed: modelName };
}
