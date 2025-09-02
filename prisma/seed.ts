// path: prisma/seed.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const foods = [
    {
      name: "Boiled Rice",
      unit: "per_100g",
      calories: 130,
      protein: 2.7,
      carbs: 28.0,
      fat: 0.3,
    },
    {
      name: "Chapati",
      unit: "per_piece",
      calories: 120,
      protein: 3.0,
      carbs: 18.0,
      fat: 3.0,
    },
    {
      name: "Dal (Lentil Curry)",
      unit: "per_100g",
      calories: 116,
      protein: 9.0,
      carbs: 20.0,
      fat: 0.5,
    },
    {
      name: "Chicken Breast (cooked)",
      unit: "per_100g",
      calories: 165,
      protein: 31.0,
      carbs: 0.0,
      fat: 3.6,
    },
    {
      name: "Egg",
      unit: "per_piece",
      calories: 78,
      protein: 6.0,
      carbs: 0.6,
      fat: 5.3,
    },
    {
      name: "Curd (Dahi)",
      unit: "per_100g",
      calories: 98,
      protein: 11.0,
      carbs: 3.4,
      fat: 4.3,
    },
    {
      name: "Idli",
      unit: "per_piece",
      calories: 58,
      protein: 2.0,
      carbs: 12.0,
      fat: 0.4,
    },
    {
      name: "Dosa",
      unit: "per_piece",
      calories: 168,
      protein: 3.9,
      carbs: 25.0,
      fat: 5.8,
    },
    {
      name: "Prawns (cooked)",
      unit: "per_100g",
      calories: 99,
      protein: 24.0,
      carbs: 0.2,
      fat: 0.3,
    },
    {
      name: "Mutton (cooked)",
      unit: "per_100g",
      calories: 294,
      protein: 25.0,
      carbs: 0.0,
      fat: 21.0,
    },
  ];
  for (const f of foods) {
    await prisma.foodItem.upsert({
      where: { name: f.name },
      update: f,
      create: f,
    });
  }
  console.log("Seeded food items:", foods.length);
}

main().finally(() => prisma.$disconnect());
