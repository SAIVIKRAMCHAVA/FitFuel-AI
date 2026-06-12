import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
export { calculateAge } from "@/lib/account-fields";

export async function getCurrentUser() {
  const session = await auth();
  const sessionUser = session?.user as
    | { id?: string; email?: string | null }
    | undefined;

  if (sessionUser?.id) {
    return prisma.user.findUnique({
      where: { id: sessionUser.id },
      include: { profile: true },
    });
  }

  if (sessionUser?.email) {
    return prisma.user.findUnique({
      where: { email: sessionUser.email },
      include: { profile: true },
    });
  }

  return null;
}
