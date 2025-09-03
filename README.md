# FitFuel AI

Track meals, water and weight — then generate a weekly diet plan tailored to you. Built for real‑world Indian food with fast parsing, optional OCR, and an AI planning engine.

This project is part of my portfolio. If you’re a recruiter or hiring manager, this README is designed to give you a quick, practical overview of the product and the engineering decisions behind it.

## Highlights

- Log meals by text or photo; map items to calories and macros.
- Track water and weight; view trends and BMI.
- Generate a 7‑day plan with Google Gemini (JSON schema guarded, rate‑limited).
- First‑class dark mode, responsive UI, and accessible forms.
- Reliable server actions with authentication guards and Prisma.
- Unit tests for the core parsing and nutrition logic.

## Tech Stack

- `Next.js 15 (App Router)` with server actions and Node runtime where needed.
- `Prisma` + PostgreSQL for data (users, logs, foods, plans, rate limits).
- `next-auth` (credentials) + `@auth/prisma-adapter`.
- `Tailwind CSS`, `next-themes`, and `lucide-react` for UI.
- `@google/generative-ai` for plan generation; `tesseract.js` OCR fallback.
- `Jest` + `ts-jest` with a tiny mock for `next/cache`.

## Features In Depth

- Nutrition mapping: `src/lib/nutrition.ts` uses a synonyms map (chapati/roti, dal/daal, etc.) and supports per‑100g / per‑piece conversions.
- Text parser: `src/lib/parse.ts` turns text like `2 chapati, dal 150g, curd 100g` into structured items.
- Image → items: `src/lib/vision.ts` prefers Gemini Vision; falls back to OCR and then reuses the parser.
- Weekly plan: `src/lib/plan.ts` builds a context from your last week and asks Gemini to produce schema‑valid JSON (checked with Zod) before storing.
- Rate limiting: `src/lib/ratelimit.ts` prevents abuse of image upload and plan generation.
- Auth everywhere: server actions verify the signed‑in user and redirect if missing.

## Screens

- Dashboard with KPIs, quick water add.
- Log Meal (Text & Image), Meals list.
- Log Water, Water history (debug).
- Log Weight & Weight history with a simple SVG trendline.
- Weekly Plan view.

> Tip: Debug pages are available in development and hidden in production via `src/middleware.ts`.

## Getting Started (Local)

Prerequisites
- Node 20+
- pnpm 10+
- PostgreSQL (local or cloud)

1) Clone & install
```bash
pnpm install
```

2) Create `.env`
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/fitfuel"
AUTH_SECRET="complex-long-random-string"
# Optional
NEXTAUTH_URL="http://localhost:3000"
GEMINI_API_KEY=""  # set to enable AI features; otherwise OCR fallback is used
```

3) Generate & migrate Prisma
```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm db:seed          # loads a small Indian foods table
```

4) Run
```bash
pnpm dev
# open http://localhost:3000
```

5) Tests & checks
```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Project Structure

- `src/app/**` — App Router routes and server actions
- `src/lib/**` — Core business logic: auth, db, parse, nutrition, plan, vision, stats, rate‑limit
- `src/components/**` — UI components (dark‑mode aware, headless patterns)
- `prisma/schema.prisma` — Data model (users, meals, water, weight, weekly plan, rate limit)

## Engineering Notes

- Safe server actions: all mutations verify the user and redirect on failure.
- Caching: `unstable_cache` used for food list and plan context where appropriate.
- Node runtime: forced on routes that need Prisma / OCR / Gemini.
- Tests: unit tests cover parsing and macro mapping; `next/cache` is mocked in `jest.setup.ts` for deterministic runs.
- DX: strict TypeScript, path alias `@/*`, and a CI workflow for typecheck/lint/test/build.

## Security & Privacy

- Passwords are hashed with `bcrypt`.
- Rate‑limited endpoints for image uploads and AI generation.
- Environment variables validated through `src/lib/env.ts` with `zod`.

## Roadmap Ideas

- Personal macro targets and insights.
- Export/import data, CSV.
- More OCR hints and auto‑unit detection.
- PWA offline logging.

## Hiring / Contact

If you’re evaluating me for a role:

- I enjoy building pragmatic product features with strong foundations (types, tests, performance and accessibility).
- I’m comfortable owning full‑stack Next.js apps end‑to‑end: data modeling, server actions/APIs, UI, and deployment.

Feel free to open an issue, reach out on GitHub, or contact me via the email on my profile. I’m happy to walk through the codebase live if helpful.

— Thanks for taking a look!
