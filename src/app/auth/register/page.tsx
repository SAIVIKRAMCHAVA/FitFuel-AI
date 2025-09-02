// path: src/app/auth/register/page.tsx
"use client";
import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [msg, setMsg] = useState<string>("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const password = String(fd.get("password"));
    const res = await fetch("/api/auth/register", {
      // <-- changed
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      setMsg("Account created. Redirecting to login...");
      setTimeout(() => (window.location.href = "/auth/login"), 800);
    } else {
      const j = await res.json().catch(() => ({}));
      setMsg(j?.error || "Failed to create account");
    }
  }

  return (
    <div className="max-w-sm mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Create account</h1>
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
          Sign up
        </button>
      </form>
      {msg && <p className="mt-3 text-sm">{msg}</p>}
      <p className="mt-4 text-sm">
        Already have an account?{" "}
        <Link className="underline" href="/auth/login">
          Login
        </Link>
      </p>
    </div>
  );
}
