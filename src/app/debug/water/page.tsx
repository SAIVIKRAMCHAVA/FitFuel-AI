// path: src/app/debug/water/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const revalidate = 0;

export default async function WaterDebugPage() {
  const session = await auth();
  if (!session?.user?.email) return <a href="/auth/login">Login</a>;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return <div>User not found</div>;

  const rows = await prisma.waterLog.findMany({
    where: { userId: user.id },
    orderBy: { at: "desc" },
    take: 50,
  });

  const total = rows.reduce((s, r) => s + r.ml, 0);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Water Logs (recent 50)</h1>
      <p className="text-sm text-gray-500 mb-4">Sum: {total} ml</p>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left border-b">
            <tr>
              <th className="py-2 pr-4">When</th>
              <th className="py-2 pr-4">ml</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b">
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
