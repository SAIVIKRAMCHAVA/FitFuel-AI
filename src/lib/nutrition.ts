// path: src/lib/nutrition.ts
import { prisma } from "@/lib/db";
import { unstable_cache as cache } from "next/cache";

export type Macro = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};
export type ItemInput = { name: string; qty: number; unit?: "g" | "piece" };

type FoodRow = {
  name: string;
  unit: string; // e.g., per_100g, per_piece, per_200ml, per_28g, per_15g, per_set, per_slice
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

const SYNONYMS: Record<string, string> = {
  chapati: "Chapati",
  roti: "Chapati",
  phulka: "Phulka",
  rice: "Boiled Rice",
  "brown rice": "Brown Rice (cooked)",
  dal: "Dal (Lentil Curry)",
  daal: "Dal (Lentil Curry)",
  lentil: "Dal (Lentil Curry)",
  curd: "Curd (Dahi)",
  dahi: "Curd (Dahi)",
  yogurt: "Curd (Dahi)",
  "greek yogurt": "Greek Yogurt (plain)",
  idli: "Idli",
  dosa: "Dosa (plain)",
  uttapam: "Uttapam (plain)",
  upma: "Upma",
  poha: "Poha",
  sambar: "Sambar",
  rasam: "Rasam",
  chana: "Chana Masala",
  chole: "Chole (Chickpea Curry)",
  rajma: "Rajma (Kidney Bean Curry)",
  paneer: "Paneer (raw)",
  "paneer tikka": "Paneer Tikka (grilled)",
  tofu: "Tofu (firm)",
  prawn: "Prawns (cooked)",
  prawns: "Prawns (cooked)",
  chicken: "Chicken Breast (cooked)",
  "chicken breast": "Chicken Breast (cooked)",
  mutton: "Mutton (cooked)",
  fish: "Fish (Rohu, cooked)",
  "fish fry": "Fish Fry (home-style)",
  egg: "Egg (boiled)",
  eggs: "Egg (boiled)",
  milk: "Milk (toned)",
  buttermilk: "Buttermilk",
  biryani: "Biryani (chicken)",
  pulao: "Pulao (veg)",
  khichdi: "Khichdi (moong dal)",
  salad: "Green Salad",
  lassi: "Lassi (sweet)",
  "curd rice": "Curd Rice",
  lemonrice: "Lemon Rice",
  lemon: "Lemon Water (no sugar)",
  peanuts: "Peanuts (roasted)",
  almond: "Almonds",
  almonds: "Almonds",
  banana: "Banana",
  apple: "Apple",
  orange: "Orange",
  mango: "Mango",
};

function norm(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const loadFoods = cache(
  async (): Promise<FoodRow[]> => {
    const foods = await prisma.foodItem.findMany({
      orderBy: { name: "asc" },
    });
    return foods as any;
  },
  ["foods_all"],
  { revalidate: 60 * 60 }
);

function matchFood(foods: FoodRow[], name: string): FoodRow | null {
  const n = norm(name);
  if (SYNONYMS[n]) {
    const target = SYNONYMS[n];
    const f = foods.find((x) => x.name.toLowerCase() === target.toLowerCase());
    if (f) return f;
  }
  let f = foods.find((x) => x.name.toLowerCase() === n);
  if (f) return f;
  f = foods.find(
    (x) => n.includes(x.name.toLowerCase()) || x.name.toLowerCase().includes(n)
  );
  if (f) return f;
  const first = n.split(" ")[0];
  f = foods.find((x) => x.name.toLowerCase().includes(first));
  return f ?? null;
}

function factorForUnit(
  foodUnit: string,
  itemUnit: "g" | "piece" | undefined,
  qty: number
) {
  if (foodUnit.startsWith("per_") && foodUnit.endsWith("g")) {
    const g = parseInt(foodUnit.replace("per_", "").replace("g", ""), 10);
    if (itemUnit === "g") return qty / g;
    return qty;
  }
  if (foodUnit.startsWith("per_") && foodUnit.endsWith("ml")) {
    const ml = parseInt(foodUnit.replace("per_", "").replace("ml", ""), 10);
    if (itemUnit === "g") return qty / ml;
    return qty;
  }
  return qty; // per_piece, per_slice, per_set...
}

export function sumMacros(
  items: { calories: number; protein: number; carbs: number; fat: number }[]
) {
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

export async function mapItemsToMacros(items: ItemInput[]) {
  const foods = await loadFoods();
  const resolved = items.map((it) => {
    const match = matchFood(foods, it.name);
    if (!match) {
      return {
        ...it,
        matched: null as any,
        macros: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        note: "No match",
      };
    }
    const factor = factorForUnit(
      match.unit,
      (it.unit ?? "piece") as any,
      it.qty || 1
    );
    const macros = {
      calories: Math.round(match.calories * factor),
      protein: +(match.protein * factor).toFixed(1),
      carbs: +(match.carbs * factor).toFixed(1),
      fat: +(match.fat * factor).toFixed(1),
    };
    return { ...it, matched: match.name, macros };
  });
  const total = sumMacros(resolved.map((r: any) => r.macros));
  return { resolved, total };
}
