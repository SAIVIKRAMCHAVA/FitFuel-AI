// path: src/app/plan/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import WeeklyPlanView from "@/components/WeeklyPlanView";
import { getOrCreateWeeklyPlan, startOfThisWeekMonday } from "@/lib/plan";
import { Button } from "@/components/ui/button";
import { enforceRateLimit } from "@/lib/ratelimit";
import type { Plan } from "@/lib/plan"; // <-- use the real Plan type

export const revalidate = 0;

// Runs only when user clicks the button
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
    seconds: 600, // 10 minutes
    limit: 2,
    userId: user.id,
  });

  await getOrCreateWeeklyPlan(user.id);

  // Ensure UI refresh shows the new plan immediately
  redirect("/plan");
}

export default async function PlanPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) redirect("/auth/login");

  const weekStart = startOfThisWeekMonday();
  const existing = await prisma.weeklyPlan.findUnique({
    where: { userId_weekStart: { userId: user.id, weekStart } },
  });

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">This Week&apos;s Diet Plan</h1>
        <form action={generateAction}>
          <Button type="submit">Generate / Refresh Plan</Button>
        </form>
      </div>

      {existing ? (
        <WeeklyPlanView plan={existing.planJson as unknown as Plan} />
      ) : (
        <p className="text-sm text-muted-foreground">
          No plan yet — click “Generate / Refresh Plan”.
        </p>
      )}
    </div>
  );
}
