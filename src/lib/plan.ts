// path: src/lib/plan.ts
import { z } from "zod";
import { prisma } from "@/lib/db";
import { aiJSON } from "@/lib/ai";
import { unstable_cache as cache } from "next/cache";

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

const loadContext = cache(
  async (userId: string) => {
    const now = new Date();
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 6,
      0,
      0,
      0,
      0
    );

    const [profile, weight, meals, waters] = await Promise.all([
      prisma.profile.findUnique({ where: { userId } }),
      prisma.weighIn.findFirst({ where: { userId }, orderBy: { at: "desc" } }),
      prisma.mealLog.groupBy({
        by: ["userId"],
        where: { userId, at: { gte: start, lte: now } },
        _sum: { calories: true, protein: true, carbs: true, fat: true },
        _count: { _all: true },
      }),
      prisma.waterLog.groupBy({
        by: ["userId"],
        where: { userId, at: { gte: start, lte: now } },
        _sum: { ml: true },
      }),
    ]);

    const h = profile?.heightCm ?? null;
    const w = weight?.weightKg ?? null;
    const bmi = h && w ? +(w / Math.pow(h / 100, 2)).toFixed(1) : null;

    const mealAgg = meals?.[0];
    const waterAgg = waters?.[0];

    const daysCount = 7;
    const avgCalories = mealAgg
      ? Math.round((mealAgg._sum.calories ?? 0) / Math.max(1, daysCount))
      : 0;
    const avgProtein = mealAgg
      ? +((mealAgg._sum.protein ?? 0) / Math.max(1, daysCount)).toFixed(1)
      : 0;
    const avgCarbs = mealAgg
      ? +((mealAgg._sum.carbs ?? 0) / Math.max(1, daysCount)).toFixed(1)
      : 0;
    const avgFat = mealAgg
      ? +((mealAgg._sum.fat ?? 0) / Math.max(1, daysCount)).toFixed(1)
      : 0;

    const avgWaterMl = waterAgg
      ? Math.round((waterAgg._sum.ml ?? 0) / Math.max(1, daysCount))
      : 0;
    const waterTargetMl = w ? Math.round(w * 35) : 2500; // 35 ml per kg

    return {
      bmi,
      heightCm: h,
      weightKg: w,
      avgCalories,
      avgProtein,
      avgCarbs,
      avgFat,
      avgWaterMl,
      waterTargetMl,
    };
  },
  ["plan_context"],
  { revalidate: 3600 }
);

function buildPrompt(ctx: Awaited<ReturnType<typeof loadContext>>) {
  const goal =
    ctx.bmi && ctx.bmi < 18.5
      ? "gain_slight"
      : ctx.bmi && ctx.bmi > 24.9
      ? "lose_slight"
      : "recomp";
  const calsBase = ctx.avgCalories || 2000;
  const targetCalories =
    goal === "gain_slight"
      ? calsBase + 300
      : goal === "lose_slight"
      ? Math.max(1400, calsBase - 300)
      : calsBase;

  return `You are a nutrition planner for an Indian user (Hyderabad). Create a 7-day diet plan optimized for ${goal}.
Use South Indian staples where possible (rice, dosa, idli, dal, curd, vegetables, eggs, chicken/prawns occasionally).
Consider:
- BMI: ${ctx.bmi ?? "unknown"} (height ${ctx.heightCm ?? "?"} cm, weight ${
    ctx.weightKg ?? "?"
  } kg)
- Recent daily averages (last 7 days): calories ${
    ctx.avgCalories
  } kcal, protein ${ctx.avgProtein} g, carbs ${ctx.avgCarbs} g, fat ${
    ctx.avgFat
  } g
- Water: avg ${ctx.avgWaterMl} ml/day vs target ${ctx.waterTargetMl} ml/day

Rules:
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

export async function getOrCreateWeeklyPlan(userId: string) {
  const weekStart = startOfThisWeekMonday();
  const existing = await prisma.weeklyPlan.findUnique({
    where: { userId_weekStart: { userId, weekStart } },
  });
  if (existing) return existing;

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

  const created = await prisma.weeklyPlan.create({
    data: {
      userId,
      weekStart,
      planJson: parsed as any,
      modelUsed: parsed.modelUsed ?? modelUsed,
      notes: parsed.notes ?? null,
    },
  });
  return created;
}
