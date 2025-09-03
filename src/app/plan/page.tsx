// path: src/app/plan/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import WeeklyPlanView from "@/components/WeeklyPlanView";
import { getOrCreateWeeklyPlan, startOfThisWeekMonday } from "@/lib/plan";
import { Button } from "@/components/ui/button";
import { enforceRateLimit } from "@/lib/ratelimit";
import type { Plan } from "@/lib/plan";

export const revalidate = 0;

/* -------------------- Local date helpers (IST) -------------------- */
function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(base.getDate() + days);
  return d;
}

function normalizePlanDatesFromWeekStart(plan: any): any {
  // Be defensive about field names to avoid crashes with older data
  const ws =
    plan?.weekStart ??
    plan?.week_start ??
    plan?.week_start_date ??
    plan?.start ??
    null;

  if (!ws || !Array.isArray(plan?.days)) return plan;

  const start = new Date(ws);
  start.setHours(0, 0, 0, 0);

  const days = plan.days.map((d: any, i: number) => ({
    ...d,
    // Always recompute day.date from the canonical weekStart + index
    date: addDays(start, i).toISOString(),
  }));

  return {
    ...plan,
    weekStart: start.toISOString(),
    days,
  } as Plan;
}

/* -------------------- Server action: generate -------------------- */
async function generateAction() {
  "use server";

  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/auth/login");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) redirect("/auth/login");

  // Rate limit: 2 generations / 10 min per user
  await enforceRateLimit({
    route: "/plan/generate",
    seconds: 600,
    limit: 2,
    userId: user.id,
  });

  await getOrCreateWeeklyPlan(user.id);
  redirect("/plan");
}

/* -------------------- Page -------------------- */
export default async function PlanPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) redirect("/auth/login");

  const weekStart = startOfThisWeekMonday();

  // Try to load an existing plan for this week
  const existing = await prisma.weeklyPlan.findUnique({
    where: { userId_weekStart: { userId: user.id, weekStart } },
    select: { planJson: true },
  });

  // If there is a stored plan, normalize its day dates from weekStart before rendering
  const normalizedPlan: Plan | null = existing
    ? (normalizePlanDatesFromWeekStart(existing.planJson) as Plan)
    : null;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">This Week&apos;s Diet Plan</h1>
        <form action={generateAction}>
          <Button type="submit">Generate / Refresh Plan</Button>
        </form>
      </div>

      {normalizedPlan ? (
        <WeeklyPlanView plan={normalizedPlan} />
      ) : (
        <p className="text-sm text-muted-foreground">
          No plan yet — click “Generate / Refresh Plan”.
        </p>
      )}
    </div>
  );
}
