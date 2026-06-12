// path: src/lib/user.ts
import { getCurrentUser } from "@/lib/account";

/** Returns the current user's id from the DB, or null if not signed in. */
export async function requireUserId() {
  const user = await getCurrentUser();
  return user?.id ?? null;
}
