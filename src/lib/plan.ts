// path: src/lib/plan.ts
import { z } from "zod";
import { prisma } from "@/lib/db";
import { aiJSON } from "@/lib/ai";

export const MealSchema = z.object({
  name: z.string(),
  calories: z.number().int().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  items: z.array(z.string()).default([]),
});

export const DaySchema = z.object({
  date: z.string(), // ISO date
  targetCalories: z.number().int().nonnegative(),
  meals: z.array(MealSchema).min(3),
});

export const PlanSchema = z.object({
  weekStart: z.string(), // ISO date (Monday)
  modelUsed: z.string().optional(),
  notes: z.string().optional(),
  days: z.array(DaySchema).length(7),
});

export type Plan = z.infer<typeof PlanSchema>;

const HISTORY_DAYS = 90;
const HISTORY_DAY_MS = 24 * 60 * 60 * 1000;

type PlanGoal = "gain_slight" | "lose_slight" | "recomp";

type MealHistoryRow = {
  at: Date;
  mealType: string;
  rawText: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  itemsJson: unknown;
};

type WaterHistoryRow = {
  at: Date;
  ml: number;
};

function mondayOf(d: Date) {
  const day = d.getDay(); // Sun=0..Sat=6
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() + diff);
  return monday;
}

export function startOfThisWeekMonday(): Date {
  return mondayOf(new Date());
}

const istDayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function dayKeyIST(date: Date) {
  const parts = istDayFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

function round1(value: number) {
  return +value.toFixed(1);
}

function summarizeMealItems(itemsJson: unknown, rawText: string | null) {
  if (Array.isArray(itemsJson)) {
    const itemNames = itemsJson
      .map((item) => {
        if (!item || typeof item !== "object") return "";
        const name = (item as { name?: unknown }).name;
        return typeof name === "string" ? name.trim() : "";
      })
      .filter(Boolean);

    if (itemNames.length > 0) return itemNames.slice(0, 6).join(", ");
  }

  return rawText?.replace(/\s+/g, " ").slice(0, 140) || "Meal";
}

function summarizeMealHistory(meals: MealHistoryRow[]) {
  const days = new Map<
    string,
    {
      date: string;
      meals: number;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }
  >();

  for (const meal of meals) {
    const date = dayKeyIST(meal.at);
    const existing =
      days.get(date) ??
      ({
        date,
        meals: 0,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      } satisfies {
        date: string;
        meals: number;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
      });

    existing.meals += 1;
    existing.calories += meal.calories;
    existing.protein += meal.protein;
    existing.carbs += meal.carbs;
    existing.fat += meal.fat;
    days.set(date, existing);
  }

  return Array.from(days.values()).map((day) => ({
    ...day,
    calories: Math.round(day.calories),
    protein: round1(day.protein),
    carbs: round1(day.carbs),
    fat: round1(day.fat),
  }));
}

function summarizeWaterHistory(waters: WaterHistoryRow[]) {
  const days = new Map<string, { date: string; ml: number; entries: number }>();

  for (const water of waters) {
    const date = dayKeyIST(water.at);
    const existing = days.get(date) ?? { date, ml: 0, entries: 0 };
    existing.ml += water.ml;
    existing.entries += 1;
    days.set(date, existing);
  }

  return Array.from(days.values()).map((day) => ({
    ...day,
    ml: Math.round(day.ml),
  }));
}

export function resolvePlanGoal(
  goalText: string | null | undefined,
  bmi: number | null | undefined,
): PlanGoal {
  const normalized = goalText?.toLowerCase() ?? "";

  if (/\b(lose|loss|reduce|cut|slim|fat loss|weight loss)\b/.test(normalized)) {
    return "lose_slight";
  }

  if (
    /\b(gain|bulk|put on|increase weight|muscle|strength|mass)\b/.test(
      normalized,
    )
  ) {
    return "gain_slight";
  }

  if (bmi && bmi < 18.5) return "gain_slight";
  if (bmi && bmi > 24.9) return "lose_slight";
  return "recomp";
}

async function loadContext(userId: string) {
  const now = new Date();
  const start = new Date(now.getTime() - (HISTORY_DAYS - 1) * HISTORY_DAY_MS);

  const [profile, weight, mealLogs, waterLogs] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.weighIn.findFirst({ where: { userId }, orderBy: { at: "desc" } }),
    prisma.mealLog.findMany({
      where: { userId, at: { gte: start, lte: now } },
      orderBy: { at: "asc" },
      select: {
        at: true,
        mealType: true,
        rawText: true,
        calories: true,
        protein: true,
        carbs: true,
        fat: true,
        itemsJson: true,
      },
    }),
    prisma.waterLog.findMany({
      where: { userId, at: { gte: start, lte: now } },
      orderBy: { at: "asc" },
      select: { at: true, ml: true },
    }),
  ]);

  const h = weight?.heightCm ?? profile?.heightCm ?? null;
  const w = weight?.weightKg ?? null;
  const bmi =
    weight?.bmi ?? (h && w ? +(w / Math.pow(h / 100, 2)).toFixed(1) : null);

  const mealHistory = summarizeMealHistory(mealLogs);
  const waterHistory = summarizeWaterHistory(waterLogs);
  const mealDaysCount = Math.max(1, mealHistory.length);
  const waterDaysCount = Math.max(1, waterHistory.length);

  const mealTotals = mealHistory.reduce(
    (total, day) => ({
      calories: total.calories + day.calories,
      protein: total.protein + day.protein,
      carbs: total.carbs + day.carbs,
      fat: total.fat + day.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const waterTotalMl = waterHistory.reduce((total, day) => total + day.ml, 0);
  const recentMeals = mealLogs.slice(-30).map((meal) => ({
    date: dayKeyIST(meal.at),
    type: meal.mealType,
    items: summarizeMealItems(meal.itemsJson, meal.rawText),
    calories: Math.round(meal.calories),
    protein: round1(meal.protein),
    carbs: round1(meal.carbs),
    fat: round1(meal.fat),
  }));

  const avgCalories = Math.round(mealTotals.calories / mealDaysCount);
  const avgProtein = round1(mealTotals.protein / mealDaysCount);
  const avgCarbs = round1(mealTotals.carbs / mealDaysCount);
  const avgFat = round1(mealTotals.fat / mealDaysCount);
  const avgWaterMl = Math.round(waterTotalMl / waterDaysCount);
  const waterTargetMl = w ? Math.round(w * 35) : 2500; // 35 ml per kg

  return {
    goalText: profile?.goal?.trim() ?? "",
    bmi,
    heightCm: h,
    weightKg: w,
    latestWeightAt: weight?.at ?? null,
    avgCalories,
    avgProtein,
    avgCarbs,
    avgFat,
    avgWaterMl,
    waterTargetMl,
    historyDays: HISTORY_DAYS,
    mealLogCount: mealLogs.length,
    mealLoggedDays: mealHistory.length,
    waterLogCount: waterLogs.length,
    waterLoggedDays: waterHistory.length,
    mealHistory,
    recentMeals,
    waterHistory,
  };
}

function buildPrompt(ctx: Awaited<ReturnType<typeof loadContext>>) {
  const goal = resolvePlanGoal(ctx.goalText, ctx.bmi);
  const calsBase = ctx.avgCalories || 2000;
  const targetCalories =
    goal === "gain_slight"
      ? calsBase + 300
      : goal === "lose_slight"
        ? Math.max(1400, calsBase - 300)
        : calsBase;

  return `You are a nutrition planner for an Indian user (Hyderabad). Create a 7-day diet plan optimized for the user's written goal and the inferred strategy "${goal}".
User-written goal: ${ctx.goalText || "No written goal saved."}
Use South Indian staples where possible (rice, dosa, idli, dal, curd, vegetables, eggs, chicken/prawns occasionally).
Consider:
- Recent body stats: BMI ${ctx.bmi ?? "unknown"} (height ${
    ctx.heightCm ?? "?"
  } cm, weight ${
    ctx.weightKg ?? "?"
  } kg, latest weight logged ${ctx.latestWeightAt?.toISOString() ?? "unknown"})
- Diet history summary (last ${
    ctx.historyDays
  } days): ${ctx.mealLogCount} meals across ${
    ctx.mealLoggedDays
  } logged days; daily averages on logged days: calories ${
    ctx.avgCalories
  } kcal, protein ${ctx.avgProtein} g, carbs ${ctx.avgCarbs} g, fat ${
    ctx.avgFat
  } g
- Diet daily totals (compact JSON): ${JSON.stringify(ctx.mealHistory)}
- Recent meal examples (compact JSON): ${JSON.stringify(ctx.recentMeals)}
- Water history summary (last ${
    ctx.historyDays
  } days): ${ctx.waterLogCount} entries across ${
    ctx.waterLoggedDays
  } logged days; avg ${ctx.avgWaterMl} ml/day on logged days vs target ${
    ctx.waterTargetMl
  } ml/day
- Water daily totals (compact JSON): ${JSON.stringify(ctx.waterHistory)}

Rules:
- Treat the user-written goal as the main goal unless it conflicts with basic safety.
- 7 days, each with breakfast, lunch, dinner, plus 1-2 snacks.
- Use diverse items from typical Indian foods (idli, dosa, upma, poha, sambar, dal, rice, chapati, curd, paneer, veggies, eggs, chicken, fish, prawns, fruits, nuts).
- Portion sizes must be realistic for an adult.
- Keep per-day total calories close to ${targetCalories} kcal.
- Output clean JSON matching the provided schema.
- Items should be human-readable strings (e.g., "2 idlis + sambar (200 ml)").

Also include a short "notes" field with hydration advice comparing ${
    ctx.avgWaterMl
  } ml to the ${ctx.waterTargetMl} ml target.`;
}

export async function getOrCreateWeeklyPlan(
  userId: string,
  options: { refresh?: boolean } = {},
) {
  const weekStart = startOfThisWeekMonday();
  const existing = await prisma.weeklyPlan.findUnique({
    where: { userId_weekStart: { userId, weekStart } },
  });
  if (existing && !options.refresh) return existing;

  const ctx = await loadContext(userId);
  const prompt = buildPrompt(ctx);

  const schema = {
    type: "object",
    properties: {
      weekStart: { type: "string" },
      modelUsed: { type: "string" },
      notes: { type: "string" },
      days: {
        type: "array",
        items: {
          type: "object",
          properties: {
            date: { type: "string" },
            targetCalories: { type: "number" },
            meals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  calories: { type: "number" },
                  protein: { type: "number" },
                  carbs: { type: "number" },
                  fat: { type: "number" },
                  items: { type: "array", items: { type: "string" } },
                },
                required: ["name", "calories", "protein", "carbs", "fat"],
              },
            },
          },
          required: ["date", "targetCalories", "meals"],
        },
      },
    },
    required: ["weekStart", "days"],
  };

  const { json, modelUsed } = await aiJSON<Plan>({ prompt, schema });
  json.weekStart = new Date(weekStart).toISOString();
  json.modelUsed = modelUsed;

  const parsed = PlanSchema.parse(json);

  const data = {
    planJson: parsed as any,
    modelUsed: parsed.modelUsed ?? modelUsed,
    notes: parsed.notes ?? null,
  };

  if (existing) {
    return prisma.weeklyPlan.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.weeklyPlan.create({
    data: {
      userId,
      weekStart,
      ...data,
    },
  });
}
