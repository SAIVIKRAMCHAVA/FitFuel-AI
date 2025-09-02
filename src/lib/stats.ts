// path: src/lib/stats.ts
import { prisma } from "@/lib/db";
import { bmi } from "@/lib/bmi";
import { startOfThisWeekMonday } from "@/lib/plan";

function startOfLocalDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export async function getTodayMealTotals(userId: string) {
  const start = startOfLocalDay();
  const end = addDays(start, 1);
  const meals = await prisma.mealLog.findMany({
    where: { userId, at: { gte: start, lt: end } },
  });
  const sum = meals.reduce(
    (s, m) => ({
      calories: s.calories + (m.calories || 0),
      protein: s.protein + (m.protein || 0),
      carbs: s.carbs + (m.carbs || 0),
      fat: s.fat + (m.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  return { ...sum, count: meals.length };
}

export async function getWaterLast24h(userId: string) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const logs = await prisma.waterLog.findMany({
    where: { userId, at: { gt: since } },
  });
  return logs.reduce((s, r) => s + r.ml, 0);
}

export async function getCurrentBmi(userId: string) {
  const [profile, latest] = await Promise.all([
    prisma.profile.findUnique({
      where: { userId },
      select: { heightCm: true },
    }),
    prisma.weighIn.findFirst({ where: { userId }, orderBy: { at: "desc" } }),
  ]);
  const value =
    latest?.weightKg && profile?.heightCm
      ? bmi(latest.weightKg, profile.heightCm)
      : null;
  return {
    bmi: value,
    heightCm: profile?.heightCm ?? null,
    weightKg: latest?.weightKg ?? null,
    at: latest?.at ?? null,
  };
}

export async function getThisWeekPlan(userId: string) {
  const weekStart = startOfThisWeekMonday();
  const plan = await prisma.weeklyPlan.findUnique({
    where: { userId_weekStart: { userId, weekStart } },
  });
  return plan;
}
