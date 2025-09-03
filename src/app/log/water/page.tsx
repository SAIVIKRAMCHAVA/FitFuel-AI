import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

type WaterRow = { id: string; at: Date; ml: number };

async function getLast24hTotal(userId: string) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const logs: WaterRow[] = await prisma.waterLog.findMany({
    where: { userId, at: { gt: since } },
    orderBy: { at: "desc" },
    select: { id: true, at: true, ml: true },
  });
  const total = logs.reduce((s: number, l: WaterRow) => s + l.ml, 0);
  return { total, logs };
}

async function addWater(formData: FormData) {
  "use server";
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) redirect("/auth/login");

  const ml = Number(formData.get("ml") || 0);
  if (!Number.isFinite(ml) || ml <= 0) return;

  await prisma.waterLog.create({
    data: { userId: user.id, ml, at: new Date() },
  });

  redirect("/log/water");
}

export default async function WaterLogPage() {
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
  if (!user) {
    return <div className="max-w-lg mx-auto p-6">User not found.</div>;
  }

  const { total, logs } = await getLast24hTotal(user.id);

  return (
    <div className="max-w-xl mx-auto p-6 space-y-5">
      <h1 className="text-2xl font-bold">Log Water</h1>

      <div className="p-4 border rounded">
        <p className="text-sm text-gray-600 mb-2">Last 24h total</p>
        <p className="text-3xl font-semibold">{total} ml</p>
      </div>

      <form action={addWater} className="space-y-3">
        <input
          name="ml"
          type="number"
          min="50"
          step="50"
          placeholder="Amount in ml (e.g. 250)"
          className="w-full p-2 border rounded"
          required
        />
        <button type="submit" className="px-4 py-2 rounded bg-black text-white">
          Add water
        </button>
      </form>

      <div className="flex gap-2">
        {[250, 500, 750, 1000].map((amt) => (
          <form action={addWater} key={amt} style={{ display: "inline" }}>
            <input type="hidden" name="ml" value={amt} />
            <button className="px-3 py-2 border rounded" type="submit">
              + {amt} ml
            </button>
          </form>
        ))}
      </div>

      <div>
        <h2 className="font-semibold mt-6 mb-2">Recent entries (24h)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left border-b">
              <tr>
                <th className="py-2 pr-4">When</th>
                <th className="py-2 pr-4">Amount</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="py-2 pr-4">{new Date(r.at).toLocaleString()}</td>
                  <td className="py-2 pr-4">{r.ml} ml</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td className="py-3 text-gray-500" colSpan={2}>
                    No entries in the last 24 hours.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <a className="underline inline-block" href="/dashboard">Back to dashboard</a>
    </div>
  );
}
