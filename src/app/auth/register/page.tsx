// path: src/app/auth/register/page.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { SEX_OPTIONS } from "@/lib/account-fields";

export default function RegisterPage() {
  const [msg, setMsg] = useState<string>("");
  const [step, setStep] = useState(1);
  const [account, setAccount] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const dateOfBirth = String(fd.get("dateOfBirth"));
    const sex = String(fd.get("sex"));
    const heightCm = String(fd.get("heightCm"));

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...account, dateOfBirth, sex, heightCm }),
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
      {step === 1 ? (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            setMsg("");
            setStep(2);
          }}
        >
          <input
            name="name"
            required
            placeholder="Name"
            value={account.name}
            onChange={(event) =>
              setAccount((prev) => ({ ...prev, name: event.target.value }))
            }
            className="w-full p-2 rounded border border-gray-300"
          />
          <input
            name="username"
            required
            minLength={3}
            maxLength={30}
            pattern="[a-zA-Z0-9_]+"
            placeholder="User_name"
            value={account.username}
            onChange={(event) =>
              setAccount((prev) => ({
                ...prev,
                username: event.target.value.toLowerCase(),
              }))
            }
            className="w-full p-2 rounded border border-gray-300"
          />
          <input
            name="email"
            type="email"
            required
            placeholder="mail_id"
            value={account.email}
            onChange={(event) =>
              setAccount((prev) => ({ ...prev, email: event.target.value }))
            }
            className="w-full p-2 rounded border border-gray-300"
          />
          <input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="Password"
            value={account.password}
            onChange={(event) =>
              setAccount((prev) => ({ ...prev, password: event.target.value }))
            }
            className="w-full p-2 rounded border border-gray-300"
          />
          <button className="w-full py-2 rounded bg-black text-white">
            Next
          </button>
        </form>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            name="dateOfBirth"
            type="date"
            required
            className="w-full p-2 rounded border border-gray-300"
          />
          <select
            name="sex"
            required
            defaultValue=""
            className="w-full p-2 rounded border border-gray-300"
          >
            <option value="" disabled>
              Sex
            </option>
            {SEX_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <input
            name="heightCm"
            type="number"
            required
            min={50}
            max={260}
            placeholder="Height in cm"
            className="w-full p-2 rounded border border-gray-300"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full py-2 rounded border"
            >
              Back
            </button>
            <button className="w-full py-2 rounded bg-black text-white">
              Create account
            </button>
          </div>
        </form>
      )}
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
