// path: src/app/meals/page.tsx
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { getCurrentUser } from "@/lib/account";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { formatDateTimeIST } from "@/lib/datetime";

export const revalidate = 0;

type MealItem = { name?: string; qty?: number; unit?: string };

async function deleteMeal(formData: FormData) {
  "use server";

  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.mealLog.deleteMany({
      where: { id, userId: user.id },
    });
  }

  redirect("/meals");
}

export default async function MealsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const meals = await prisma.mealLog.findMany({
    where: { userId: user.id },
    orderBy: { at: "desc" },
    take: 50,
  });

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Your meals</h1>

      {meals.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No meals yet. Try logging one from 'Log meal'.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="text-left p-3 font-medium">When</th>
                <th className="text-left p-3 font-medium">Type</th>
                <th className="text-left p-3 font-medium">Items</th>
                <th className="text-left p-3 font-medium">Calories</th>
                <th className="text-left p-3 font-medium">P / C / F</th>
                <th className="p-3 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {meals.map((m: any) => {
                const items: MealItem[] = Array.isArray(m.itemsJson)
                  ? (m.itemsJson as MealItem[])
                  : [];

                const itemsText =
                  items.length > 0
                    ? items
                        .map((i) =>
                          [i.name, i.qty ? `${i.qty}` : undefined, i.unit]
                            .filter(Boolean)
                            .join(" "),
                        )
                        .join(", ")
                    : (m.rawText?.slice(0, 120) ?? "");

                return (
                  <tr
                    key={m.id}
                    className="group odd:bg-card even:bg-muted/40 border-t hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-3 whitespace-nowrap">
                      {formatDateTimeIST(m.at)}
                    </td>
                    <td className="p-3">{m.mealType}</td>
                    <td className="p-3">{itemsText}</td>
                    <td className="p-3">{Math.round(m.calories ?? 0)}</td>
                    <td className="p-3">
                      {Math.round(m.protein ?? 0)} / {Math.round(m.carbs ?? 0)}{" "}
                      / {Math.round(m.fat ?? 0)}
                    </td>
                    <td className="group/actions p-2 text-right">
                      <form action={deleteMeal}>
                        <input type="hidden" name="id" value={m.id} />
                        <ConfirmDeleteButton
                          label="Delete meal"
                          message="Delete this meal?"
                        />
                      </form>
                    </td>
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
