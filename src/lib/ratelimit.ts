import { prisma } from "@/lib/db";
import { headers } from "next/headers";

function startOfWindow(seconds: number) {
  const t = Math.floor(Date.now() / (seconds * 1000)) * (seconds * 1000);
  return new Date(t);
}

export async function getClientIp(): Promise<string> {
  // Next 15 types make headers() async -> await it
  const h = await headers();
  const xf = h.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();

  // Common proxies on Vercel/Node
  return h.get("x-real-ip") || h.get("x-vercel-forwarded-for") || "0.0.0.0";
}

export async function enforceRateLimit(opts: {
  route: string;
  seconds: number; // window size
  limit: number; // max count in window
  userId?: string | null;
  ip?: string | null;
}) {
  const window = startOfWindow(opts.seconds);
  const ip = opts.ip ?? (await getClientIp());
  const userId = opts.userId ?? null;

  const row = await prisma.rateLimit.upsert({
    where: {
      userId_ip_route_window: { userId, ip, route: opts.route, window },
    },
    create: { userId, ip, route: opts.route, window, count: 1 },
    update: { count: { increment: 1 } },
    select: { count: true },
  });

  if (row.count > opts.limit) {
    const reset = new Date(
      window.getTime() + opts.seconds * 1000
    ).toISOString();
    const err = new Error("Too Many Requests");
    // @ts-expect-error add metadata for UI
    err.status = 429;
    // @ts-expect-error
    err.reset = reset;
    throw err;
  }
}
