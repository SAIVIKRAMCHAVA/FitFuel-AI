// path: src/app/log/weight/page.tsx
import { getCurrentUser } from "@/lib/account";
import { bmi } from "@/lib/bmi";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

async function saveWeighIn(formData: FormData) {
  "use server";

  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const heightCm = user.profile?.heightCm ?? null;
  if (!heightCm) {
    redirect(
      `/account/edit?error=${encodeURIComponent(
        "Set your height before logging weight.",
      )}`,
    );
  }

  const weightKg = Number(formData.get("weightKg") || 0);
  if (Number.isFinite(weightKg) && weightKg > 0) {
    await prisma.weighIn.create({
      data: {
        userId: user.id,
        at: new Date(),
        weightKg,
        heightCm,
        bmi: bmi(weightKg, heightCm),
      },
    });
  }

  redirect("/weight/history");
}

export default async function WeightLogPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">Please login</h1>
        <a className="underline" href="/auth/login">
          Go to Login
        </a>
      </div>
    );
  }

  const heightCm = user.profile?.heightCm ?? null;

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Log Weight</h1>

      {!heightCm && (
        <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Set your height on the{" "}
          <a href="/account/edit" className="underline">
            profile edit page
          </a>{" "}
          before logging weight.
        </p>
      )}

      <form action={saveWeighIn} className="space-y-3">
        <input
          name="weightKg"
          type="number"
          step="0.1"
          min="1"
          placeholder="Weight (kg)"
          className="w-full p-2 border rounded"
          required
        />
        <p className="text-sm text-muted-foreground">
          Height used for this entry:{" "}
          {heightCm ? `${heightCm} cm from your profile` : "not set"}
        </p>
        <button
          className="px-4 py-2 rounded bg-black text-white disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={!heightCm}
        >
          Save
        </button>
      </form>

      <a className="underline inline-block" href="/weight/history">
        View history
      </a>
    </div>
  );
}
