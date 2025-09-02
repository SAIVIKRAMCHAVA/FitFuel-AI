// path: src/lib/stats.ts
import { prisma } from "@/lib/db";

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
  const meals = await prisma.mealLog.aggregate({
    where: { userId, at: { gte: start, lt: end } },
    _sum: { calories: true, protein: true, carbs: true, fat: true },
  });
  const s = meals._sum;
  return {
    calories: Math.round(s.calories ?? 0),
    protein: +(s.protein ?? 0).toFixed(1),
    carbs: +(s.carbs ?? 0).toFixed(1),
    fat: +(s.fat ?? 0).toFixed(1),
  };
}

export async function getWaterLast24h(userId: string) {
  const end = new Date();
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
  const water = await prisma.waterLog.aggregate({
    where: { userId, at: { gte: start, lte: end } },
    _sum: { ml: true },
  });
  return Math.round(water._sum.ml ?? 0);
}

export async function getCurrentBmi(userId: string) {
  const [profile, latest] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.weighIn.findFirst({ where: { userId }, orderBy: { at: "desc" } }),
  ]);
  const h = profile?.heightCm ?? null;
  const w = latest?.weightKg ?? null;
  const value = h && w ? +(w / Math.pow(h / 100, 2)).toFixed(1) : null;
  return {
    bmi: value,
    heightCm: h,
    weightKg: w,
    at: latest?.at ?? null,
  };
}

export async function getThisWeekPlan(userId: string) {
  const now = new Date();
  const day = now.getDay(); // Sun=0..Sat=6
  const diff = day === 0 ? -6 : 1 - day;
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() + diff);
  const plan = await prisma.weeklyPlan.findUnique({
    where: { userId_weekStart: { userId, weekStart } },
  });
  return plan;
}
