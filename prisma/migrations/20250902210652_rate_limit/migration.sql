-- CreateTable
CREATE TABLE "public"."RateLimit" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "ip" TEXT,
    "route" TEXT NOT NULL,
    "window" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RateLimit_userId_ip_route_window_key" ON "public"."RateLimit"("userId", "ip", "route", "window");
