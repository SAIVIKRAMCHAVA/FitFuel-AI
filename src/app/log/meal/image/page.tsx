// path: src/app/log/meal/image/page.tsx
import { getCurrentUser } from "@/lib/account";
import { parseDateTimeLocal } from "@/lib/datetime";
import { prisma } from "@/lib/db";
import { analyzeMealImage } from "@/lib/vision";
import { mapItemsToMacros } from "@/lib/nutrition";
import { redirect } from "next/navigation";
import { enforceRateLimit } from "@/lib/ratelimit";
import { MealImageForm } from "./MealImageForm";
import type { Prisma, MealType } from "@prisma/client";

export const runtime = "nodejs"; // needed for Tesseract/Gemini

export type MealImageFormState = {
  error?: string;
};

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

async function saveFromImage(
  _state: MealImageFormState,
  formData: FormData,
): Promise<MealImageFormState> {
  "use server";

  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  // Rate limit: 5 uploads / 60s per user
  await enforceRateLimit({
    route: "/log/meal/image",
    seconds: 60,
    limit: 5,
    userId: user.id,
  });

  const mealType = toMealType(String(formData.get("mealType") ?? "SNACK"));
  const at = parseDateTimeLocal(formData.get("at"));
  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0) {
    return { error: "Choose a meal photo before analyzing." };
  }

  try {
    const ab = await file.arrayBuffer();
    const bytes = Buffer.from(ab);
    const vr = await analyzeMealImage(bytes, file.type);

    const nutrition = vr.estimatedItems?.length
      ? {
          resolved: vr.estimatedItems.map((item) => ({
            name: item.name,
            qty: item.qty,
            unit: item.unit,
            macros: {
              calories: item.calories,
              protein: item.protein,
              carbs: item.carbs,
              fat: item.fat,
            },
            source: "gemini",
            confidence: item.confidence,
            notes: item.notes,
          })),
          total: vr.total ?? {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
          },
        }
      : await mapItemsToMacros(
          vr.items.map((i) => ({ name: i.name, qty: i.qty, unit: i.unit })),
        );

    await prisma.mealLog.create({
      data: {
        userId: user.id,
        mealType,
        at,
        rawText: vr.rawText.slice(0, 8000),
        ocrJson: {
          source: vr.source,
          notes: vr.notes,
          modelUsed: vr.modelUsed,
          nutritionSource: vr.estimatedItems?.length ? "gemini" : "database",
        } as Prisma.InputJsonValue,
        calories: Math.round(nutrition.total.calories),
        protein: nutrition.total.protein,
        carbs: nutrition.total.carbs,
        fat: nutrition.total.fat,
        // cast JSON safely with Prisma type (no `any`)
        itemsJson: nutrition.resolved as unknown as Prisma.InputJsonValue,
      },
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Image analysis failed. Please try another photo.",
    };
  }

  redirect("/meals");
}

export default async function MealImageLogPage() {
  const user = await getCurrentUser();
  if (!user) {
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
      <MealImageForm action={saveFromImage} />
      <p className="text-sm text-gray-600">
        Uses Google Gemini Vision via <code>GEMINI_API_KEY</code>. If no key is
        set, Tesseract OCR is used.
      </p>
      <a className="underline inline-block" href="/meals">
        View meals
      </a>
    </div>
  );
}
