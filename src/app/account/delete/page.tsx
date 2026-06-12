import Link from "next/link";
import { redirect } from "next/navigation";
import { deleteAccount } from "@/app/account/actions";
import { getCurrentUser } from "@/lib/account";

export default async function DeleteAccountPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const params = await searchParams;

  return (
    <div className="mx-auto max-w-md p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-red-700">Delete account</h1>
        <p className="text-sm text-muted-foreground">
          This permanently deletes your profile, meal logs, water logs, weight
          logs, and weekly plans.
        </p>
      </div>

      {params?.error && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {params.error}
        </p>
      )}

      <form action={deleteAccount} className="space-y-3">
        <input
          name="password"
          type="password"
          required
          placeholder="Confirm password"
          className="w-full rounded border p-2"
        />
        <div className="flex gap-2">
          <Link
            href="/account"
            className="w-full rounded border py-2 text-center"
          >
            Cancel
          </Link>
          <button className="w-full rounded bg-red-700 py-2 text-white">
            Delete account
          </button>
        </div>
      </form>
    </div>
  );
}
