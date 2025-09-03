// path: src/app/log/meal/image/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { analyzeMealImage } from "@/lib/vision";
import { mapItemsToMacros } from "@/lib/nutrition";
import { redirect } from "next/navigation";
import { enforceRateLimit } from "@/lib/ratelimit";
import type { Prisma, MealType } from "@prisma/client";

export const runtime = "nodejs"; // needed for Tesseract/Gemini

function toMealType(value: string): MealType {
  const v = value.toUpperCase();
  const allowed = new Set<MealType>([
    "BREAKFAST",
    "LUNCH",
    "DINNER",
    "SNACK",
  ] as const);
  return allowed.has(v as MealType) ? (v as MealType) : "SNACK";
}

async function saveFromImage(formData: FormData) {
  "use server";

  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/auth/login");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) redirect("/auth/login");

  // Rate limit: 5 uploads / 60s per user
  await enforceRateLimit({
    route: "/log/meal/image",
    seconds: 60,
    limit: 5,
    userId: user.id,
  });

  const mealType = toMealType(String(formData.get("mealType") ?? "SNACK"));
  const atStr = String(formData.get("at") ?? new Date().toISOString());
  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0) return;

  const ab = await file.arrayBuffer();
  const bytes = Buffer.from(ab);
  const vr = await analyzeMealImage(bytes, file.type);

  const { resolved, total } = await mapItemsToMacros(
    vr.items.map((i) => ({ name: i.name, qty: i.qty, unit: i.unit }))
  );

  await prisma.mealLog.create({
    data: {
      userId: user.id,
      mealType,
      at: new Date(atStr),
      rawText: vr.rawText.slice(0, 8000),
      calories: total.calories,
      protein: total.protein,
      carbs: total.carbs,
      fat: total.fat,
      // cast JSON safely with Prisma type (no `any`)
      itemsJson: resolved as unknown as Prisma.InputJsonValue,
    },
  });

  redirect("/meals");
}

export default async function MealImageLogPage() {
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
      <h1 className="text-2xl font-bold">Log Meal (Image)</h1>
      <form action={saveFromImage} className="space-y-3">
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
        <input
          type="file"
          name="photo"
          accept="image/*"
          required
          className="w-full p-2 border rounded"
        />
        <button className="px-4 py-2 rounded bg-black text-white" type="submit">
          Analyze & Save
        </button>
      </form>
      <p className="text-sm text-gray-600">
        Uses Google Gemini Vision via <code>GEMINI_API_KEY</code>, falls back to
        Tesseract OCR if not set.
      </p>
      <a className="underline inline-block" href="/meals">
        View meals
      </a>
    </div>
  );
}
