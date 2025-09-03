// path: src/lib/ratelimit.ts
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

function startOfWindow(seconds: number) {
  const t = Math.floor(Date.now() / (seconds * 1000)) * (seconds * 1000);
  return new Date(t);
}

export async function getClientIp(): Promise<string> {
  // Next's types may mark headers() as async; awaiting is safe
  const h = await headers();
  const xf = h.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  return h.get("x-real-ip") || h.get("x-vercel-forwarded-for") || "0.0.0.0";
}

export class RateLimitError extends Error {
  status: number;
  reset: string;
  constructor(reset: string) {
    super("Too Many Requests");
    this.name = "RateLimitError";
    this.status = 429;
    this.reset = reset;
  }
}

export async function enforceRateLimit(opts: {
  route: string;
  seconds: number; // window size
  limit: number; // max count in window
  userId: string; // require a real user id (we rate-limit only signed-in flows)
  ip?: string | null;
}) {
  const window = startOfWindow(opts.seconds);
  const ip = (opts.ip ?? (await getClientIp())) || "0.0.0.0";

  const row = await prisma.rateLimit.upsert({
    where: {
      userId_ip_route_window: {
        userId: opts.userId,
        ip,
        route: opts.route,
        window,
      },
    },
    create: { userId: opts.userId, ip, route: opts.route, window, count: 1 },
    update: { count: { increment: 1 } },
    select: { count: true },
  });

  if (row.count > opts.limit) {
    const reset = new Date(
      window.getTime() + opts.seconds * 1000
    ).toISOString();
    throw new RateLimitError(reset);
  }
}
