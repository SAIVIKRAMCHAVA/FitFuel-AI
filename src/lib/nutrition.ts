// path: src/lib/nutrition.ts
import { prisma } from "@/lib/db";

export type Macro = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};
export type ItemInput = { name: string; qty: number; unit?: "g" | "piece" };

export function sumMacros(items: Macro[]) {
  return items.reduce(
    (a, b) => ({
      calories: a.calories + b.calories,
      protein: a.protein + b.protein,
      carbs: a.carbs + b.carbs,
      fat: a.fat + b.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

// map simple items to macros using FoodItem table
export async function mapItemsToMacros(items: ItemInput[]) {
  const names = items.map((i) => i.name.trim().toLowerCase());
  const dbItems = await prisma.foodItem.findMany({
    where: {
      name: { in: names.map((n) => n.charAt(0).toUpperCase() + n.slice(1)) },
    },
  });

  const resolved = items.map((it) => {
    const match = dbItems.find(
      (fi) => fi.name.toLowerCase() === it.name.toLowerCase()
    );
    if (!match) {
      return { ...it, macros: { calories: 0, protein: 0, carbs: 0, fat: 0 } };
    }
    const isPer100g = match.unit === "per_100g";
    const factor = isPer100g ? (it.qty || 100) / 100 : it.qty || 1;
    return {
      ...it,
      macros: {
        calories: Math.round(match.calories * factor),
        protein: +(match.protein * factor).toFixed(1),
        carbs: +(match.carbs * factor).toFixed(1),
        fat: +(match.fat * factor).toFixed(1),
      },
    };
  });

  const total = sumMacros(resolved.map((r: any) => r.macros));
  return { resolved, total };
}
