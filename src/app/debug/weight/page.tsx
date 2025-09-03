// path: src/app/debug/weight/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import WeightChart from "@/components/WeightChart";
import { bmi, bmiCategory } from "@/lib/bmi";

export const revalidate = 0;

type WeighIn = { id: string; at: Date; weightKg: number };

export default async function WeightDebugPage() {
  const session = await auth();
  if (!session?.user?.email) return <a href="/auth/login">Login</a>;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      profile: { select: { heightCm: true } },
      weighIns: {
        select: { id: true, at: true, weightKg: true },
        orderBy: { at: "asc" },
      },
    },
  });
  if (!user) return <div>User not found</div>;

  const points = user.weighIns.map((w: WeighIn) => ({
    at: w.at.toISOString(),
    kg: w.weightKg,
  }));
  const latest = user.weighIns.at(-1);
  const currentBmi = latest
    ? bmi(latest.weightKg, user.profile?.heightCm ?? undefined)
    : null;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Weight History</h1>

      <div className="p-4 border rounded">
        <p className="text-sm text-gray-600">Latest</p>
        <p className="text-lg">
          {latest
            ? `${latest.weightKg.toFixed(1)} kg - ${new Date(
                latest.at
              ).toLocaleString()}`
            : "-"}
        </p>
        <p className="text-sm mt-1">
          BMI: <b>{currentBmi ?? "-"}</b>{" "}
          {currentBmi ? `(${bmiCategory(currentBmi)})` : ""}
        </p>
        {!user.profile?.heightCm && (
          <p className="text-xs text-gray-500 mt-1">
            Tip: set your height on{" "}
            <a className="underline" href="/log/weight">
              Log Weight
            </a>{" "}
            to compute BMI.
          </p>
        )}
      </div>

      <div className="p-4 border rounded">
        <p className="font-semibold mb-2">Trend</p>
        <WeightChart weights={points} />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="text-left py-2 pr-4 font-medium">When</th>
              <th className="text-left py-2 pr-4 font-medium">Weight (kg)</th>
            </tr>
          </thead>
          <tbody>
            {user.weighIns
              .slice()
              .reverse()
              .map((r: WeighIn) => (
                <tr
                  key={r.id}
                  className="odd:bg-card even:bg-muted/40 border-t hover:bg-muted/50 transition-colors"
                >
                  <td className="py-2 pr-4">
                    {new Date(r.at).toLocaleString()}
                  </td>
                  <td className="py-2 pr-4">{r.weightKg.toFixed(1)}</td>
                </tr>
              ))}
            {user.weighIns.length === 0 && (
              <tr>
                <td className="py-3 text-gray-500" colSpan={2}>
                  No entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <a className="underline inline-block" href="/log/weight">
        Log a new weight
      </a>
    </div>
  );
}
