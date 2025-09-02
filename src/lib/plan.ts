// path: src/lib/plan.ts
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getGemini } from "@/lib/gemini";
import type { MealLog, WeighIn, Profile } from "@prisma/client";

export const DayMealSchema = z.object({
  name: z.string(),
  calories: z.number().int().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  items: z.array(z.string()).default([]),
});

export const DayPlanSchema = z.object({
  date: z.string(), // YYYY-MM-DD
  targetCalories: z.number().int().positive(),
  meals: z.array(DayMealSchema).min(3), // breakfast/lunch/dinner at least
});

export const WeeklyPlanSchema = z.object({
  weekStart: z.string(), // YYYY-MM-DD (Monday)
  modelUsed: z.string().optional(),
  notes: z.string().optional(),
  days: z.array(DayPlanSchema).length(7),
});

export type WeeklyPlan = z.infer<typeof WeeklyPlanSchema>;

function mondayOf(date: Date): Date {
  const d = new Date(date);
  const dow = d.getDay(); // 0=Sun..6=Sat
  const diff = (dow + 6) % 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - diff);
  return d;
}

export function isoDate(d: Date): string {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c.toISOString().slice(0, 10);
}

type RecentContext = {
  profile: Profile | null;
  meals: MealLog[];
  waterLast24: number;
  weighIns: WeighIn[];
  dailyCaloriesAvg: number;
};

export async function getRecentContext(userId: string): Promise<RecentContext> {
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const meals = await prisma.mealLog.findMany({
    where: { userId, at: { gt: since } },
    orderBy: { at: "desc" },
    take: 200,
  });

  const water = await prisma.waterLog.findMany({
    where: { userId, at: { gt: since } },
    orderBy: { at: "desc" },
    take: 200,
  });

  const weighIns = await prisma.weighIn.findMany({
    where: { userId },
    orderBy: { at: "desc" },
    take: 20,
  });

  const profile = await prisma.profile.findUnique({ where: { userId } });

  const dayKeys = new Set<string>(meals.map((m) => isoDate(m.at)));
  const totalCals = meals.reduce<number>(
    (sum, m) => sum + (m.calories || 0),
    0
  );
  const dailyCaloriesAvg =
    dayKeys.size > 0 ? Math.round(totalCals / dayKeys.size) : 1800;

  const waterLast24 = water.reduce<number>((sum, w) => {
    const within = Date.now() - w.at.getTime() < 24 * 3600 * 1000;
    return sum + (within ? w.ml : 0);
  }, 0);

  return { profile, meals, waterLast24, weighIns, dailyCaloriesAvg };
}

function baselinePlan(
  userId: string,
  weekStart: Date,
  context: RecentContext
): WeeklyPlan {
  const target = Math.min(
    2400,
    Math.max(1600, Math.round(context.dailyCaloriesAvg / 100) * 100)
  );

  const templates = [
    {
      name: "Breakfast",
      items: ["Idli (2)", "Sambar (100g)", "Curd (100g)"],
      pc: [400, 18, 60, 8],
    },
    {
      name: "Lunch",
      items: ["Chapati (2)", "Dal (150g)", "Salad"],
      pc: [650, 28, 80, 18],
    },
    {
      name: "Dinner",
      items: ["Boiled Rice (200g)", "Chicken (120g)", "Curd (100g)"],
      pc: [750, 45, 85, 20],
    },
  ];

  const baseTotal = templates.reduce<number>((s, t) => s + t.pc[0], 0);
  const factor = target / baseTotal;

  const days = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);

    const meals = templates.map((t) => {
      const [c, p, crb, f] = t.pc;
      return {
        name: t.name,
        calories: Math.round(c * factor),
        protein: Math.round(p * factor),
        carbs: Math.round(crb * factor),
        fat: Math.round(f * factor),
        items: t.items,
      };
    });

    return {
      date: isoDate(date),
      targetCalories: target,
      meals,
    };
  });

  return {
    weekStart: isoDate(weekStart),
    modelUsed: "baseline-rule",
    notes: "Generated without AI (offline baseline).",
    days,
  };
}

async function geminiPlan(
  userId: string,
  weekStart: Date,
  context: RecentContext
): Promise<WeeklyPlan> {
  const gemini = getGemini();
  if (!gemini) return baselinePlan(userId, weekStart, context);

  const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });

  const recentMeals = context.meals.slice(0, 30).map((m) => ({
    at: m.at.toISOString(),
    mealType: m.mealType,
    calories: m.calories,
    protein: m.protein,
    carbs: m.carbs,
    fat: m.fat,
    raw: m.rawText,
  }));
  const latestWeight = context.weighIns[0]?.weightKg ?? null;
  const heightCm = context.profile?.heightCm ?? null;

  const system = `You are a nutrition coach for Indian diet. Create a 7-day meal plan (Breakfast/Lunch/Dinner) in STRICT JSON that matches the schema below. Target daily calories near the user's recent average.`;
  const schemaTip = `Schema:
{
  "weekStart": "YYYY-MM-DD",
  "modelUsed": "string",
  "notes": "string",
  "days": [
    {
      "date": "YYYY-MM-DD",
      "targetCalories": 2000,
      "meals": [
        { "name": "Breakfast", "calories": 500, "protein": 25, "carbs": 60, "fat": 15, "items": ["..."] },
        { "name": "Lunch",     "calories": 700, "protein": 35, "carbs": 80, "fat": 20, "items": ["..."] },
        { "name": "Dinner",    "calories": 700, "protein": 35, "carbs": 80, "fat": 20, "items": ["..."] }
      ]
    }
  ]
}`;

  const prompt = [
    system,
    schemaTip,
    `Constraints:
- Units in grams or pieces where natural; macros as numbers (no strings).
- Sum of meal calories per day ~ targetCalories (±10% ok).
- Prefer simple Indian meals; avoid unrealistic items.

User context:
- Latest weight: ${latestWeight ?? "unknown"} kg, Height: ${
      heightCm ?? "unknown"
    } cm
- Estimated recent daily avg calories: ~${context.dailyCaloriesAvg}
- Water last 24h: ${context.waterLast24} ml
- Recent meals (sample): ${JSON.stringify(recentMeals)}

Return JSON only. Start with { and end with }.
Week starts on: ${isoDate(weekStart)} (Monday).`,
  ].join("\n\n");

  // Use simple string call to keep types happy
  const res = await model.generateContent(prompt as unknown as string);
  const text = res.response.text() ?? "";

  let jsonText = text;
  const m = text.match(/\{[\s\S]*\}/);
  if (m) jsonText = m[0];

  const parsed = JSON.parse(jsonText);
  if (!parsed.weekStart) parsed.weekStart = isoDate(weekStart);
  parsed.modelUsed = parsed.modelUsed || "gemini-1.5-flash";

  const plan = WeeklyPlanSchema.parse(parsed);
  return plan;
}

export async function getOrCreateWeeklyPlan(userId: string, weekStart: Date) {
  const existing = await prisma.weeklyPlan.findUnique({
    where: { userId_weekStart: { userId, weekStart } },
  });
  if (existing) return existing;

  const ctx = await getRecentContext(userId);
  let plan = await geminiPlan(userId, weekStart, ctx);
  plan = WeeklyPlanSchema.parse(plan);

  const created = await prisma.weeklyPlan.create({
    data: {
      userId,
      weekStart,
      planJson: plan as any,
      modelUsed: plan.modelUsed ?? "unknown",
      notes: plan.notes ?? null,
    },
  });
  return created;
}

export function startOfThisWeekMonday(): Date {
  return mondayOf(new Date());
}
