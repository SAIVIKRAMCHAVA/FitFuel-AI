// path: src/app/debug/foods/page.tsx
import { prisma } from "@/lib/db";

export const revalidate = 0;

type Food = {
  id: string;
  name: string;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export default async function FoodsDebugPage() {
  const rows: Food[] = await prisma.foodItem.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, unit: true, calories: true, protein: true, carbs: true, fat: true },
  });
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Seeded Food Items</h1>
      <p className="text-sm text-neutral-400 mb-4">Rows: {rows.length}</p>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="text-left py-2 pr-4 font-medium">Name</th>
              <th className="text-left py-2 pr-4 font-medium">Unit</th>
              <th className="text-left py-2 pr-4 font-medium">Calories</th>
              <th className="text-left py-2 pr-4 font-medium">Protein</th>
              <th className="text-left py-2 pr-4 font-medium">Carbs</th>
              <th className="text-left py-2 pr-4 font-medium">Fat</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: Food) => (
              <tr
                key={r.id}
                className="odd:bg-card even:bg-muted/40 border-t hover:bg-muted/50 transition-colors"
              >
                <td className="py-2 pr-4">{r.name}</td>
                <td className="py-2 pr-4">{r.unit}</td>
                <td className="py-2 pr-4">{r.calories}</td>
                <td className="py-2 pr-4">{r.protein}</td>
                <td className="py-2 pr-4">{r.carbs}</td>
                <td className="py-2 pr-4">{r.fat}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
