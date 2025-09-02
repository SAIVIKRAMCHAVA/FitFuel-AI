// path: src/app/log/meal/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { mapItemsToMacros } from "@/lib/nutrition";
import { requireUserId } from "@/lib/user";
import { redirect } from "next/navigation";

function parseItemsFromText(text: string) {
  // examples: "2 chapati, dal 150g, curd 100g"
  const parts = text
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.map((p) => {
    // match "150g dal" or "2 chapati"
    const m1 = p.match(/^(\d+)\s*([a-zA-Z]*)\s*(.*)$/); // "2 chapati" or "150g dal"
    if (m1) {
      const qty = parseInt(m1[1], 10);
      const maybeUnit = (m1[2] || "").toLowerCase();
      const unit = maybeUnit.includes("g") ? "g" : "piece";
      const name = (m1[3] || p).trim() || p;
      return { name, qty, unit: unit as "g" | "piece" };
    }
    return { name: p, qty: 1, unit: "piece" as const };
  });
}

// Keep the action outside the component to avoid "session possibly null" TS issues.
async function createMeal(formData: FormData) {
  "use server";
  const userId = await requireUserId();
  if (!userId) redirect("/auth/login");

  const mealType = String(formData.get("mealType") || "SNACK");
  const atStr = String(formData.get("at") || new Date().toISOString());
  const text = String(formData.get("text") || "").trim();
  if (!text) return;

  const items = parseItemsFromText(text);
  const { resolved, total } = await mapItemsToMacros(items);

  await prisma.mealLog.create({
    data: {
      userId,
      mealType: mealType as any,
      at: new Date(atStr),
      rawText: text,
      // ocrJson: omit (avoid TS error for JSON null)
      calories: total.calories,
      protein: total.protein,
      carbs: total.carbs,
      fat: total.fat,
      itemsJson: resolved as any,
    },
  });

  redirect("/debug/meals");
}

export default async function MealLogPage() {
  const session = await auth();
  if (!session?.user) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">Please login</h1>
        <a className="underline" href="/auth/login">
          Go to Login
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Log Meal (Text)</h1>
      <form action={createMeal} className="space-y-3">
        <select name="mealType" className="w-full p-2 border rounded">
          <option>BREAKFAST</option>
          <option>LUNCH</option>
          <option>DINNER</option>
          <option>SNACK</option>
        </select>
        <input
          type="datetime-local"
          name="at"
          className="w-full p-2 border rounded"
        />
        <textarea
          name="text"
          rows={4}
          placeholder="e.g. 2 chapati, dal 150g, curd 100g"
          className="w-full p-2 border rounded"
          required
        />
        <button className="px-4 py-2 rounded bg-black text-white" type="submit">
          Save
        </button>
      </form>
      <p className="text-sm text-gray-600">
        After saving you’ll be redirected to <code>/debug/meals</code>.
      </p>
    </div>
  );
}
