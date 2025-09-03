// path: src/app/debug/water/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const revalidate = 0;

type WaterRow = { id: string; at: Date; ml: number };

export default async function WaterDebugPage() {
  const session = await auth();
  if (!session?.user?.email) return <a href="/auth/login">Login</a>;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return <div>User not found</div>;

  const rows: WaterRow[] = await prisma.waterLog.findMany({
    where: { userId: user.id },
    orderBy: { at: "desc" },
    take: 50,
    select: { id: true, at: true, ml: true },
  });

  const total = rows.reduce((s: number, r: WaterRow) => s + r.ml, 0);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Water Logs (recent 50)</h1>
      <p className="text-sm text-gray-500 mb-4">Sum: {total} ml</p>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="text-left py-2 pr-4 font-medium">When</th>
              <th className="text-left py-2 pr-4 font-medium">ml</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: WaterRow) => (
              <tr
                key={r.id}
                className="odd:bg-card even:bg-muted/40 border-t hover:bg-muted/50 transition-colors"
              >
                <td className="py-2 pr-4">{new Date(r.at).toLocaleString()}</td>
                <td className="py-2 pr-4">{r.ml}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="py-3 text-gray-500" colSpan={2}>
                  No entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <a className="underline inline-block mt-4" href="/log/water">
        Log water
      </a>
    </div>
  );
}
