// path: src/app/api/foods/route.ts
import { prisma } from "@/lib/db";

export const revalidate = 0; // no cache

export async function GET() {
  const rows = await prisma.foodItem.findMany({ orderBy: { name: "asc" } });
  return Response.json({ count: rows.length, rows });
}
