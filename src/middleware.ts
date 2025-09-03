import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  if (
    process.env.NODE_ENV === "production" &&
    req.nextUrl.pathname.startsWith("/debug")
  ) {
    return new NextResponse("Not found", { status: 404 });
  }
}

export const config = { matcher: ["/debug/:path*"] };
