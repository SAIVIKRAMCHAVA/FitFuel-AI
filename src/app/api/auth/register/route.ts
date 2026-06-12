// path: src/app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";
import {
  isValidUsername,
  normalizeEmail,
  normalizeUsername,
  SEX_OPTIONS,
} from "@/lib/account-fields";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const username = normalizeUsername(String(body.username ?? ""));
    const email = normalizeEmail(String(body.email ?? ""));
    const password = String(body.password ?? "");
    const dateOfBirthRaw = String(body.dateOfBirth ?? "");
    const sex = String(body.sex ?? "");
    const heightCm = Number(body.heightCm);

    if (
      !name ||
      !username ||
      !email ||
      !password ||
      !dateOfBirthRaw ||
      !sex ||
      !Number.isFinite(heightCm)
    ) {
      return NextResponse.json(
        { error: "Please fill all required fields." },
        { status: 400 },
      );
    }

    if (!isValidUsername(username)) {
      return NextResponse.json(
        {
          error:
            "Username must be 3-30 characters and use only letters, numbers, underscores, or periods.",
        },
        { status: 400 },
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    const dateOfBirth = new Date(`${dateOfBirthRaw}T00:00:00.000Z`);
    if (
      Number.isNaN(dateOfBirth.getTime()) ||
      dateOfBirth.getTime() > Date.now()
    ) {
      return NextResponse.json(
        { error: "Enter a valid date of birth." },
        { status: 400 },
      );
    }

    if (!SEX_OPTIONS.includes(sex)) {
      return NextResponse.json(
        { error: "Select a valid sex option." },
        { status: 400 },
      );
    }

    if (heightCm < 50 || heightCm > 260) {
      return NextResponse.json(
        { error: "Height must be between 50 cm and 260 cm." },
        { status: 400 },
      );
    }

    const exists = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
      select: { email: true, username: true },
    });

    if (exists?.email === email) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 },
      );
    }

    if (exists?.username === username) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        name,
        username,
        email,
        passwordHash,
        profile: {
          create: {
            dateOfBirth,
            sex,
            heightCm: Math.round(heightCm),
          },
        },
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
