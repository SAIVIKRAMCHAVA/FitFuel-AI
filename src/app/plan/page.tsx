// path: src/app/plan/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import WeeklyPlanView from "@/components/WeeklyPlanView";
import { getOrCreateWeeklyPlan, startOfThisWeekMonday } from "@/lib/plan";

export const revalidate = 0;

async function generateAction() {
  "use server";
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/auth/login");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) redirect("/auth/login");

  const weekStart = startOfThisWeekMonday();
  await getOrCreateWeeklyPlan(user.id, weekStart);

  redirect("/plan");
}

export default async function PlanPage() {
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

  const weekStart = startOfThisWeekMonday();
  const existing = await prisma.weeklyPlan.findUnique({
    where: { userId_weekStart: { userId: user.id, weekStart } },
  });

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Weekly Plan</h1>

      <form action={generateAction}>
        <button className="px-4 py-2 rounded bg-black text-white" type="submit">
          {existing ? "Regenerate Plan" : "Generate Plan"}
        </button>
      </form>

      {!existing && (
        <p className="text-sm text-gray-600">
          No plan found for this week. Click the button to generate (uses Gemini
          if <code>GEMINI_API_KEY</code> is set, otherwise offline baseline).
        </p>
      )}

      {existing && <WeeklyPlanView plan={existing.planJson as any} />}
    </div>
  );
}
