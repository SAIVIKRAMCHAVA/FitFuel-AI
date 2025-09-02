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

// Simple synonym map -> DB FoodItem.name
const CANDIDATE_TO_DB: Record<string, string> = {
  chapati: "Chapati",
  roti: "Chapati",
  rice: "Boiled Rice",
  dal: "Dal (Lentil Curry)",
  daal: "Dal (Lentil Curry)",
  lentil: "Dal (Lentil Curry)",
  curd: "Curd (Dahi)",
  dahi: "Curd (Dahi)",
  yogurt: "Curd (Dahi)",
  idli: "Idli",
  dosa: "Dosa",
  prawn: "Prawns (cooked)",
  prawns: "Prawns (cooked)",
  chicken: "Chicken Breast (cooked)",
  "chicken breast": "Chicken Breast (cooked)",
  mutton: "Mutton (cooked)",
  egg: "Egg",
  eggs: "Egg",
};

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function guessDbName(raw: string): string | null {
  const n = normalize(raw);
  for (const key of Object.keys(CANDIDATE_TO_DB)) {
    if (n.includes(key)) return CANDIDATE_TO_DB[key];
  }
  // fallback: capitalize first letter only
  const cap = raw.trim().charAt(0).toUpperCase() + raw.trim().slice(1);
  return cap || null;
}

export async function mapItemsToMacros(items: ItemInput[]) {
  const dbItems = await prisma.foodItem.findMany();
  const byName = new Map(dbItems.map((d) => [d.name, d]));

  const resolved = items.map((it) => {
    const dbName = guessDbName(it.name) || it.name;
    const match = byName.get(dbName);
    if (!match) {
      return {
        ...it,
        matched: null as string | null,
        macros: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      };
    }
    const isPer100g = match.unit === "per_100g";
    const factor = isPer100g
      ? ((it.unit === "g" ? it.qty : it.qty * 100) || 100) / 100
      : it.qty || 1;
    return {
      ...it,
      matched: match.name,
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
