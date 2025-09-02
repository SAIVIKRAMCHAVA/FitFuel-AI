// path: src/lib/env.ts
import { z } from "zod";

const Env = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(20),
  NEXTAUTH_URL: z.string().url().optional(),
  GEMINI_API_KEY: z.string().optional(),
});

export const env = Env.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
});
