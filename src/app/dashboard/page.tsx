// path: src/app/dashboard/page.tsx
export const revalidate = 0; // disable page caching for instant updates

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
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Quick "+250ml" action
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
      <div className="max-w-lg mx-auto py-24 text-center space-y-4">
        <h1 className="text-3xl font-bold">Welcome to FitFuel AI</h1>
        <p className="text-muted-foreground">
          Track meals, water and weight - then get a weekly plan powered by AI.
        </p>
        <div className="flex gap-2 justify-center">
          <Link href="/auth/login">
            <Button>Login</Button>
          </Link>
          <Link href="/auth/register">
            <Button variant="secondary">Create account</Button>
          </Link>
        </div>
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) redirect("/auth/login");

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
            meals.carbs
          )} / F ${Math.round(meals.fat)}`}
        />
        <StatCard
          title="Water (24h)"
          value={`${water} ml`}
          footer={
            <form action={addWater250}>
              <Button variant="link" className="h-auto p-0">
                +250 ml
              </Button>
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

