// path: src/app/weight/history/page.tsx
import { getCurrentUser } from "@/lib/account";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export const revalidate = 0;

export default async function WeightHistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const logs = await prisma.weighIn.findMany({
    where: { userId: user.id },
    orderBy: { at: "desc" },
    take: 100,
  });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
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
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="text-left p-3 font-medium">When</th>
                <th className="text-left p-3 font-medium">Weight (kg)</th>
                <th className="text-left p-3 font-medium">Height (cm)</th>
                <th className="text-left p-3 font-medium">BMI</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((r) => {
                const when = new Date(r.at).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "Asia/Kolkata",
                });
                return (
                  <tr
                    key={r.id}
                    className="odd:bg-card even:bg-muted/40 border-t hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-3 whitespace-nowrap">{when}</td>
                    <td className="p-3">{r.weightKg.toFixed(1)}</td>
                    <td className="p-3">{r.heightCm ?? "-"}</td>
                    <td className="p-3">{r.bmi?.toFixed(1) ?? "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
