// path: src/lib/user.ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** Returns the current user's id from the DB, or null if not signed in. */
export async function requireUserId() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;
  const user = await prisma.user.findUnique({ where: { email } });
  return user?.id ?? null;
}
