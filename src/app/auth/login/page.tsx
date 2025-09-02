// path: src/app/auth/login/page.tsx
"use client";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const password = String(fd.get("password"));
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/dashboard",
    });
    if (res?.ok) window.location.href = "/dashboard";
    else setMsg("Invalid email or password");
  }

  return (
    <div className="max-w-sm mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="w-full p-2 rounded border border-gray-300"
        />
        <input
          name="password"
          type="password"
          required
          placeholder="Password"
          className="w-full p-2 rounded border border-gray-300"
        />
        <button className="w-full py-2 rounded bg-black text-white">
          Login
        </button>
      </form>
      {msg && <p className="mt-3 text-sm">{msg}</p>}
      <p className="mt-4 text-sm">
        No account?{" "}
        <Link className="underline" href="/auth/register">
          Register
        </Link>
      </p>
    </div>
  );
}
