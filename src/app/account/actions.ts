"use server";

import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/account";
import {
  isValidUsername,
  normalizeEmail,
  normalizeUsername,
  SEX_OPTIONS,
} from "@/lib/account-fields";

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function parseDateOfBirth(value: FormDataEntryValue | null) {
  const raw = String(value ?? "");
  const date = new Date(`${raw}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function updateProfile(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const name = String(formData.get("name") ?? "").trim();
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const dateOfBirth = parseDateOfBirth(formData.get("dateOfBirth"));
  const sex = String(formData.get("sex") ?? "");
  const heightCm = Number(formData.get("heightCm"));

  if (!name) redirectWithError("/account/edit", "Name is required.");
  if (!isValidUsername(username)) {
    redirectWithError(
      "/account/edit",
      "Username must be 3-30 characters and use only letters, numbers, underscores, or periods.",
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirectWithError("/account/edit", "Enter a valid email address.");
  }
  if (!dateOfBirth || dateOfBirth.getTime() > Date.now()) {
    redirectWithError("/account/edit", "Enter a valid date of birth.");
  }
  if (!SEX_OPTIONS.includes(sex)) {
    redirectWithError("/account/edit", "Select a valid sex option.");
  }
  if (!Number.isFinite(heightCm) || heightCm < 50 || heightCm > 260) {
    redirectWithError(
      "/account/edit",
      "Height must be between 50 cm and 260 cm.",
    );
  }

  const conflict = await prisma.user.findFirst({
    where: {
      id: { not: user.id },
      OR: [{ username }, { email }],
    },
    select: { username: true, email: true },
  });

  if (conflict?.username === username) {
    redirectWithError("/account/edit", "Username already taken.");
  }
  if (conflict?.email === email) {
    redirectWithError("/account/edit", "Email already registered.");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      username,
      email,
      profile: {
        upsert: {
          create: {
            dateOfBirth,
            sex,
            heightCm: Math.round(heightCm),
          },
          update: {
            dateOfBirth,
            sex,
            heightCm: Math.round(heightCm),
          },
        },
      },
    },
  });

  redirect("/account?updated=1");
}

export async function changePassword(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const oldPassword = String(formData.get("oldPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const verifyPassword = String(formData.get("verifyPassword") ?? "");

  if (!user.passwordHash) {
    redirectWithError(
      "/account/change-password",
      "This account does not have a password set.",
    );
  }

  const oldPasswordOk = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!oldPasswordOk) {
    redirectWithError("/account/change-password", "Old password is incorrect.");
  }

  if (newPassword.length < 8) {
    redirectWithError(
      "/account/change-password",
      "New password must be at least 8 characters.",
    );
  }

  if (newPassword !== verifyPassword) {
    redirectWithError(
      "/account/change-password",
      "New passwords do not match.",
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  redirect("/account/change-password?success=1");
}

export async function deleteAccount(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const password = String(formData.get("password") ?? "");
  if (!user.passwordHash) {
    redirectWithError(
      "/account/delete",
      "This account does not have a password set.",
    );
  }

  const passwordOk = await bcrypt.compare(password, user.passwordHash);
  if (!passwordOk) {
    redirectWithError("/account/delete", "Password is incorrect.");
  }

  await prisma.$transaction([
    prisma.rateLimit.deleteMany({ where: { userId: user.id } }),
    prisma.weeklyPlan.deleteMany({ where: { userId: user.id } }),
    prisma.weighIn.deleteMany({ where: { userId: user.id } }),
    prisma.waterLog.deleteMany({ where: { userId: user.id } }),
    prisma.mealLog.deleteMany({ where: { userId: user.id } }),
    prisma.profile.deleteMany({ where: { userId: user.id } }),
    prisma.session.deleteMany({ where: { userId: user.id } }),
    prisma.account.deleteMany({ where: { userId: user.id } }),
    prisma.user.delete({ where: { id: user.id } }),
  ]);

  redirect("/auth/login?deleted=1");
}
