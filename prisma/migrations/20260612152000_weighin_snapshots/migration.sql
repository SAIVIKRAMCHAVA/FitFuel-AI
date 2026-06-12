-- Store height and BMI on each weigh-in so historical rows do not change when
-- profile height changes later.
ALTER TABLE "WeighIn"
  ADD COLUMN "heightCm" INTEGER,
  ADD COLUMN "bmi" DOUBLE PRECISION;

UPDATE "WeighIn" wi
SET
  "heightCm" = p."heightCm",
  "bmi" = ROUND(
    (
      wi."weightKg" / POWER((p."heightCm"::double precision / 100.0), 2)
    )::numeric,
    1
  )::double precision
FROM "Profile" p
WHERE
  p."userId" = wi."userId"
  AND p."heightCm" IS NOT NULL
  AND p."heightCm" > 0;
