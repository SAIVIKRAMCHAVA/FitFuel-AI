import Link from "next/link";
import { redirect } from "next/navigation";
import { changePassword } from "@/app/account/actions";
import { PendingButton } from "@/components/PendingButton";
import { getCurrentUser } from "@/lib/account";

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; success?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const params = await searchParams;

  return (
    <div className="mx-auto max-w-md p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Change Password</h1>
        <p className="text-sm text-muted-foreground">
          Confirm your old password before choosing a new one.
        </p>
      </div>

      {params?.error && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {params.error}
        </p>
      )}
      {params?.success && (
        <p className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Password changed.
        </p>
      )}

      <form action={changePassword} className="space-y-3">
        <input
          name="oldPassword"
          type="password"
          required
          placeholder="Old password"
          className="w-full rounded border p-2"
        />
        <input
          name="newPassword"
          type="password"
          required
          minLength={8}
          placeholder="New password"
          className="w-full rounded border p-2"
        />
        <input
          name="verifyPassword"
          type="password"
          required
          minLength={8}
          placeholder="Confirm new password"
          className="w-full rounded border p-2"
        />
        <div className="flex gap-2">
          <Link
            href="/account"
            className="w-full rounded border py-2 text-center"
          >
            Back
          </Link>
          <PendingButton className="w-full" pendingText="Updating...">
            Update password
          </PendingButton>
        </div>
      </form>
    </div>
  );
}
