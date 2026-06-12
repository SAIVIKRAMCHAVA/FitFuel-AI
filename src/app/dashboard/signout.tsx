// path: src/app/dashboard/signout.tsx
"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export default function SignOutButton() {
  const [isPending, setIsPending] = useState(false);

  return (
    <button
      className="px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={isPending}
      onClick={() => {
        setIsPending(true);
        signOut({ callbackUrl: "/" });
      }}
    >
      {isPending ? "Logging out..." : "Logout"}
    </button>
  );
}
