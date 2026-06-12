import Link from "next/link";
import { redirect } from "next/navigation";
import { updateProfile } from "@/app/account/actions";
import { PendingButton } from "@/components/PendingButton";
import { getCurrentUser } from "@/lib/account";
import { SEX_OPTIONS } from "@/lib/account-fields";

export const revalidate = 0;

function dateInputValue(date: Date | null | undefined) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export default async function EditAccountPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const params = await searchParams;

  return (
    <div className="mx-auto max-w-lg p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Edit details</h1>
        <p className="text-sm text-muted-foreground">
          Update the details shown on your profile.
        </p>
      </div>

      {params?.error && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {params.error}
        </p>
      )}

      <form action={updateProfile} className="space-y-3">
        <input
          name="name"
          required
          defaultValue={user.name ?? ""}
          placeholder="Name"
          className="w-full rounded border p-2"
        />
        <input
          name="username"
          required
          minLength={3}
          maxLength={30}
          pattern="[a-zA-Z0-9_.]+"
          title="Use only letters, numbers, underscores, and periods."
          defaultValue={user.username ?? ""}
          placeholder="User_name"
          className="w-full rounded border p-2"
        />
        <input
          name="email"
          type="email"
          required
          defaultValue={user.email ?? ""}
          placeholder="mail_id"
          className="w-full rounded border p-2"
        />
        <input
          name="dateOfBirth"
          type="date"
          required
          defaultValue={dateInputValue(user.profile?.dateOfBirth)}
          className="w-full rounded border p-2"
        />
        <select
          name="sex"
          required
          defaultValue={user.profile?.sex ?? ""}
          className="w-full rounded border p-2"
        >
          <option value="" disabled>
            Sex
          </option>
          {SEX_OPTIONS.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <div className="flex items-center rounded border focus-within:ring-1 focus-within:ring-ring">
          <input
            name="heightCm"
            type="number"
            required
            min={50}
            max={260}
            defaultValue={user.profile?.heightCm ?? ""}
            placeholder="Height"
            className="w-full rounded-l p-2 outline-none"
          />
          <span className="px-3 text-sm text-muted-foreground">cm</span>
        </div>
        <div className="flex gap-2">
          <Link
            href="/account"
            className="w-full rounded border py-2 text-center"
          >
            Cancel
          </Link>
          <PendingButton className="w-full" pendingText="Saving...">
            Save details
          </PendingButton>
        </div>
      </form>
    </div>
  );
}
