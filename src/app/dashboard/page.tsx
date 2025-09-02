// path: src/app/dashboard/page.tsx
import { auth } from "@/lib/auth";
import SignOutButton from "./signout";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">Please login</h1>
        <a className="underline" href="/auth/login">
          Go to Login
        </a>
      </div>
    );
  }
  return (
    <div className="max-w-lg mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-sm">
        Signed in as <b>{session.user.email}</b>
      </p>
      <SignOutButton />
    </div>
  );
}
