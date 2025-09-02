// path: src/app/plan/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import WeeklyPlanView from "@/components/WeeklyPlanView";
import { getOrCreateWeeklyPlan, startOfThisWeekMonday } from "@/lib/plan";
import { Button } from "@/components/ui/button";

export const revalidate = 0;

// This runs only when user clicks the button
async function generateAction() {
  "use server";
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/auth/login");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) redirect("/auth/login");

  // AI call happens here (not during page load)
  await getOrCreateWeeklyPlan(user.id);
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
        <h1 className="text-2xl font-bold">This Week's Diet Plan</h1>
        <form action={generateAction}>
          <Button type="submit">Generate / Refresh Plan</Button>
        </form>
      </div>

      {existing ? (
        <WeeklyPlanView plan={existing.planJson as any} />
      ) : (
        <p className="text-sm text-muted-foreground">
          No plan yet — click “Generate / Refresh Plan”.
        </p>
      )}
    </div>
  );
}
