// path: src/app/api/auth/[...nextauth]/route.ts
export { GET, POST } from "@/lib/auth";
export const runtime = "nodejs"; // Prisma needs Node runtime
