import { getCurrentUser } from "@/lib/account";
import { formatDateTimeIST } from "@/lib/datetime";
import { prisma } from "@/lib/db";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { redirect } from "next/navigation";

export const revalidate = 0;

async function deleteWaterLog(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.waterLog.deleteMany({
      where: { id, userId: user.id },
    });
  }

  redirect("/water/history");
}

export default async function WaterHistoryPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">Please login</h1>
        <a className="underline" href="/auth/login">
          Go to Login
        </a>
      </div>
    );
  }

  const logs = await prisma.waterLog.findMany({
    where: { userId: user.id },
    orderBy: { at: "desc" },
  });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Water history</h1>
        <a href="/log/water" className="underline">
          Log water
        </a>
      </div>

      {logs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No water entries yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="text-left p-3 font-medium">When</th>
                <th className="text-left p-3 font-medium">Amount</th>
                <th className="w-12 p-3" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {logs.map((r) => (
                <tr
                  key={r.id}
                  className="group odd:bg-card even:bg-muted/40 border-t hover:bg-muted/50 transition-colors"
                >
                  <td className="p-3 whitespace-nowrap">
                    {formatDateTimeIST(r.at)}
                  </td>
                  <td className="p-3">{r.ml} ml</td>
                  <td className="group/actions p-3 text-right">
                    <form action={deleteWaterLog}>
                      <input type="hidden" name="id" value={r.id} />
                      <ConfirmDeleteButton
                        label="Delete water entry"
                        message="Delete this water entry?"
                      />
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
