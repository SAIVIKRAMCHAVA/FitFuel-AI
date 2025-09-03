// path: src/app/weight/history/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export const revalidate = 0;

export default async function WeightHistoryPage() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, profile: { select: { heightCm: true } } },
  });
  if (!user) redirect("/auth/login");

  // We use the WeighIn model (not weightLog)
  const logs = await prisma.weighIn.findMany({
    where: { userId: user.id },
    orderBy: { at: "desc" },
    take: 100,
  });

  const currentHeight = user.profile?.heightCm ?? null;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Weight history</h1>

      {logs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No entries yet. Log your first weight from the{" "}
          <a href="/log/weight" className="underline">
            Log Weight
          </a>{" "}
          page.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">When</th>
                <th className="text-left p-3">Weight (kg)</th>
                <th className="text-left p-3">Height (cm)</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(
                (r: { id: string; at: Date; weightKg: number | null }) => {
                  const when = new Date(r.at).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "Asia/Kolkata",
                  });
                  return (
                    <tr
                      key={r.id}
                      className="odd:bg-white even:bg-gray-50 border-t"
                    >
                      <td className="p-3 whitespace-nowrap">{when}</td>
                      <td className="p-3">
                        {typeof r.weightKg === "number"
                          ? r.weightKg.toFixed(1)
                          : "—"}
                      </td>
                      <td className="p-3">{currentHeight ?? "—"}</td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
