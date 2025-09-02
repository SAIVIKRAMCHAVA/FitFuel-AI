// path: src/app/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import {
  getCurrentBmi,
  getTodayMealTotals,
  getWaterLast24h,
  getThisWeekPlan,
} from "@/lib/stats";
import StatCard from "@/components/StatCard";

// quick '+250ml' server action
async function addWater250() {
  "use server";
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/auth/login");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) redirect("/auth/login");
  await prisma.waterLog.create({
    data: { userId: user.id, ml: 250, at: new Date() },
  });
  redirect("/dashboard");
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.email) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">Please login</h1>
        <a className="underline" href="/auth/login">
          Go to Login
        </a>
      </div>
    );
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) redirect("/auth/login");

  const [meals, water, body, plan] = await Promise.all([
    getTodayMealTotals(user.id),
    getWaterLast24h(user.id),
    getCurrentBmi(user.id),
    getThisWeekPlan(user.id),
  ]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid md:grid-cols-4 gap-4">
        <StatCard
          title="Today's Calories"
          value={`${meals.calories} kcal`}
          footer={`Meals: ${meals.count} • P ${Math.round(
            meals.protein
          )} / C ${Math.round(meals.carbs)} / F ${Math.round(meals.fat)}`}
        />
        <StatCard
          title="Water (last 24h)"
          value={`${water} ml`}
          footer={
            <form action={addWater250}>
              <button className="underline" type="submit">
                +250 ml
              </button>
            </form>
          }
        />
        <StatCard
          title="Body"
          value={body.bmi != null ? `BMI ${body.bmi}` : "—"}
          footer={
            body.weightKg
              ? `${body.weightKg.toFixed(1)} kg${
                  body.heightCm ? ` • ${body.heightCm} cm` : ""
                }`
              : "Log your weight"
          }
        />
        <StatCard
          title="Weekly Plan"
          value={plan ? "Ready" : "Not generated"}
          footer={
            <a className="underline" href="/plan">
              {plan ? "Open plan →" : "Generate plan →"}
            </a>
          }
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <a href="/log/meal" className="p-4 border rounded hover:bg-gray-50">
          ➕ Log meal (text)
        </a>
        <a
          href="/log/meal/image"
          className="p-4 border rounded hover:bg-gray-50"
        >
          📷 Log meal (image)
        </a>
        <a href="/log/water" className="p-4 border rounded hover:bg-gray-50">
          💧 Log water
        </a>
        <a href="/log/weight" className="p-4 border rounded hover:bg-gray-50">
          ⚖️ Log weight
        </a>
        <a href="/debug/meals" className="p-4 border rounded hover:bg-gray-50">
          🧪 Meals debug
        </a>
        <a href="/debug/weight" className="p-4 border rounded hover:bg-gray-50">
          🧪 Weight debug
        </a>
      </div>
    </div>
  );
}
