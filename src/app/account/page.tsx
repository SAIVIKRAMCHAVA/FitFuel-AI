import Link from "next/link";
import { redirect } from "next/navigation";
import { calculateAge, getCurrentUser } from "@/lib/account";
import SignOutButton from "@/app/dashboard/signout";

export const revalidate = 0;

function formatDate(date: Date | null | undefined) {
  if (!date) return "Not set";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded border p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams?: Promise<{ updated?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const params = await searchParams;
  const profile = user.profile;
  const age = calculateAge(profile?.dateOfBirth);

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account and personal details.
          </p>
        </div>
        <Link
          href="/account/edit"
          className="rounded bg-black px-4 py-2 text-center text-sm font-medium text-white"
        >
          Edit details
        </Link>
      </div>

      {params?.updated && (
        <p className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Profile updated.
        </p>
      )}

      <section className="grid gap-3 sm:grid-cols-2">
        <Detail label="Name" value={user.name || "Not set"} />
        <Detail label="User_name" value={user.username || "Not set"} />
        <Detail label="mail_id" value={user.email || "Not set"} />
        <Detail
          label="Date of Birth"
          value={formatDate(profile?.dateOfBirth)}
        />
        <Detail label="Age" value={age != null ? `${age} years` : "Not set"} />
        <Detail label="Sex" value={profile?.sex || "Not set"} />
        <Detail
          label="Height"
          value={profile?.heightCm ? `${profile.heightCm} cm` : "Not set"}
        />
      </section>

      <section className="flex flex-col gap-2 sm:flex-row">
        <Link
          href="/account/change-password"
          className="rounded border px-4 py-2 text-center text-sm font-medium hover:bg-muted"
        >
          Change Password
        </Link>
        <SignOutButton />
        <Link
          href="/account/delete"
          className="rounded border border-red-300 px-4 py-2 text-center text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Delete account
        </Link>
      </section>
    </div>
  );
}
