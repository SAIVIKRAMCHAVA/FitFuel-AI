// path: src/app/log/weight/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

async function saveWeighIn(formData: FormData) {
  "use server";
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/auth/login");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) redirect("/auth/login");

  const weightKg = Number(formData.get("weightKg") || 0);
  const heightCm = formData.get("heightCm");
  if (heightCm) {
    const h = Number(heightCm);
    if (Number.isFinite(h) && h > 0) {
      await prisma.profile.upsert({
        where: { userId: user.id },
        update: { heightCm: Math.round(h) },
        create: { userId: user.id, heightCm: Math.round(h) },
      });
    }
  }

  if (Number.isFinite(weightKg) && weightKg > 0) {
    await prisma.weighIn.create({
      data: { userId: user.id, at: new Date(), weightKg },
    });
  }

  redirect("/debug/weight");
}

export default async function WeightLogPage() {
  const session = await auth();
  if (!session?.user?.email) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">Please login</h1>
        <a className="underline" href="/auth/login">
          Go to Login
        </a>
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, profile: true },
  });

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Log Weight</h1>
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
        <input
          name="heightCm"
          type="number"
          step="1"
          min="50"
          placeholder={`Height (cm)${
            user?.profile?.heightCm
              ? ` — current ${user.profile.heightCm} cm`
              : ""
          }`}
          className="w-full p-2 border rounded"
        />
        <button className="px-4 py-2 rounded bg-black text-white" type="submit">
          Save
        </button>
      </form>

      <a className="underline inline-block" href="/debug/weight">
        View history
      </a>
    </div>
  );
}
