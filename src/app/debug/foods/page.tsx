// path: src/app/debug/foods/page.tsx
import { prisma } from "@/lib/db";

export const revalidate = 0;

export default async function FoodsDebugPage() {
  const rows = await prisma.foodItem.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Seeded Food Items</h1>
      <p className="text-sm text-neutral-400 mb-4">Rows: {rows.length}</p>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left border-b border-white/10">
            <tr>
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Unit</th>
              <th className="py-2 pr-4">Calories</th>
              <th className="py-2 pr-4">Protein</th>
              <th className="py-2 pr-4">Carbs</th>
              <th className="py-2 pr-4">Fat</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-white/5">
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
