// path: src/app/debug/weight/page.tsx
import { getCurrentUser } from "@/lib/account";
import { prisma } from "@/lib/db";
import WeightChart from "@/components/WeightChart";
import { bmiCategory } from "@/lib/bmi";

export const revalidate = 0;

type WeighIn = {
  id: string;
  at: Date;
  weightKg: number;
  heightCm: number | null;
  bmi: number | null;
};

export default async function WeightDebugPage() {
  const user = await getCurrentUser();
  if (!user) return <a href="/auth/login">Login</a>;

  const weighIns = await prisma.weighIn.findMany({
    where: { userId: user.id },
    select: { id: true, at: true, weightKg: true, heightCm: true, bmi: true },
    orderBy: { at: "asc" },
  });

  const points = weighIns.map((w: WeighIn) => ({
    at: w.at.toISOString(),
    kg: w.weightKg,
  }));
  const latest = weighIns.at(-1);
  const currentBmi = latest?.bmi ?? null;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Weight History</h1>

      <div className="p-4 border rounded">
        <p className="text-sm text-gray-600">Latest</p>
        <p className="text-lg">
          {latest
            ? `${latest.weightKg.toFixed(1)} kg - ${new Date(
                latest.at,
              ).toLocaleString()}`
            : "-"}
        </p>
        <p className="text-sm mt-1">
          BMI: <b>{currentBmi ?? "-"}</b>{" "}
          {currentBmi ? `(${bmiCategory(currentBmi)})` : ""}
        </p>
        {!latest?.heightCm && (
          <p className="text-xs text-gray-500 mt-1">
            Tip: set your height on{" "}
            <a className="underline" href="/account/edit">
              your profile
            </a>{" "}
            before logging weight to snapshot BMI.
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
              <th className="text-left py-2 pr-4 font-medium">Height (cm)</th>
              <th className="text-left py-2 pr-4 font-medium">BMI</th>
            </tr>
          </thead>
          <tbody>
            {weighIns
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
                  <td className="py-2 pr-4">{r.heightCm ?? "-"}</td>
                  <td className="py-2 pr-4">{r.bmi?.toFixed(1) ?? "-"}</td>
                </tr>
              ))}
            {weighIns.length === 0 && (
              <tr>
                <td className="py-3 text-gray-500" colSpan={4}>
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
