// path: src/app/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-3">FitFuel AI</h1>
      <p>
        Please{" "}
        <a className="underline" href="/auth/login">
          login
        </a>{" "}
        or{" "}
        <a className="underline" href="/auth/register">
          create an account
        </a>
        .
      </p>
    </main>
  );
}
