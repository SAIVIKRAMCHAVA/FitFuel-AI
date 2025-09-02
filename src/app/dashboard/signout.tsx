// path: src/app/dashboard/signout.tsx
"use client";
import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      className="px-4 py-2 rounded bg-black text-white"
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      Logout
    </button>
  );
}
