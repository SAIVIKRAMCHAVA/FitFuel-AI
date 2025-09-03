// path: src/app/debug/meals/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const revalidate = 0;

type MealRow = {
  id: string;
  at: Date;
  mealType: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  rawText: string | null;
};

export default async function MealsDebugPage() {
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

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!dbUser) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">User not found</h1>
        <p className="text-sm text-gray-500">
          Your session is valid but we couldn't find your user record.
        </p>
      </div>
    );
  }

  const rows: MealRow[] = await prisma.mealLog.findMany({
    where: { userId: dbUser.id },
    orderBy: { at: "desc" },
    take: 20,
    select: {
      id: true,
      at: true,
      mealType: true,
      calories: true,
      protein: true,
      carbs: true,
      fat: true,
      rawText: true,
    },
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Recent Meals</h1>
      <p className="text-sm text-gray-500 mb-3">
        Showing {rows.length} most recent entries
      </p>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="text-left py-2 pr-4 font-medium">When</th>
              <th className="text-left py-2 pr-4 font-medium">Type</th>
              <th className="text-left py-2 pr-4 font-medium">Calories</th>
              <th className="text-left py-2 pr-4 font-medium">P/C/F</th>
              <th className="text-left py-2 pr-4 font-medium">Raw</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: MealRow) => (
              <tr
                key={r.id}
                className="odd:bg-card even:bg-muted/40 border-t hover:bg-muted/50 transition-colors"
              >
                <td className="py-2 pr-4">{new Date(r.at).toLocaleString()}</td>
                <td className="py-2 pr-4">{r.mealType}</td>
                <td className="py-2 pr-4">{r.calories}</td>
                <td className="py-2 pr-4">
                  {Math.round(r.protein)} / {Math.round(r.carbs)} / {Math.round(r.fat)}
                </td>
                <td className="py-2 pr-4">{r.rawText}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <a className="underline inline-block mt-4" href="/log/meal">
        Log another meal
      </a>
    </div>
  );
}
