// path: src/app/dashboard/page.tsx
export const revalidate = 0; // disable page caching for instant updates

import { getCurrentUser } from "@/lib/account";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import {
  getCurrentBmi,
  getTodayMealTotals,
  getWaterLast24h,
  getThisWeekPlan,
} from "@/lib/stats";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { PendingButton } from "@/components/PendingButton";
import { WelcomeAuthPrompt } from "@/components/WelcomeAuthPrompt";
import Link from "next/link";

// Quick "+250ml" action
async function addWater250() {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  await prisma.waterLog.create({
    data: { userId: user.id, ml: 250, at: new Date() },
  });

  redirect("/dashboard");
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return <WelcomeAuthPrompt />;

  // Fresh values every request (no cache)
  const [meals, water, body, plan] = await Promise.all([
    getTodayMealTotals(user.id),
    getWaterLast24h(user.id),
    getCurrentBmi(user.id),
    getThisWeekPlan(user.id),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <section className="rounded-lg border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Nice to see you back. Keep your streak going today!
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/log/meal">
              <Button>Log meal</Button>
            </Link>
            <Link href="/log/meal/image">
              <Button variant="secondary">Upload photo</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Calories"
          value={`${meals.calories} kcal`}
          footer={`P ${Math.round(meals.protein)} / C ${Math.round(
            meals.carbs,
          )} / F ${Math.round(meals.fat)}`}
        />
        <StatCard
          title="Water (24h)"
          value={`${water} ml`}
          footer={
            <form action={addWater250}>
              <PendingButton
                variant="link"
                className="h-auto p-0"
                pendingText="Adding..."
              >
                +250 ml
              </PendingButton>
            </form>
          }
        />
        <StatCard
          title="Body"
          value={body.bmi != null ? `BMI ${body.bmi}` : "-"}
          footer={
            body.weightKg
              ? `${body.weightKg.toFixed(1)} kg${
                  body.heightCm ? `, ${body.heightCm} cm` : ""
                }`
              : "Log your weight"
          }
        />
        <StatCard
          title="Weekly Plan"
          value={plan ? "Ready" : "Not generated"}
          footer={
            <Link className="underline" href="/plan">
              {plan ? "Open plan" : "Generate plan"}
            </Link>
          }
        />
      </section>

      {/* Shortcuts */}
      <section className="grid md:grid-cols-3 gap-4">
        <Link
          href="/meals"
          className="rounded-lg border p-4 hover:bg-muted/40 transition"
        >
          View meals
        </Link>
        <Link
          href="/log/water"
          className="rounded-lg border p-4 hover:bg-muted/40 transition"
        >
          Log water
        </Link>
        <Link
          href="/log/weight"
          className="rounded-lg border p-4 hover:bg-muted/40 transition"
        >
          Log weight
        </Link>
      </section>
    </div>
  );
}
