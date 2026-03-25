# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nammal (നമ്മൾ) is a free matrimony platform for the Kerala/South Indian community. Every profile must be manually approved by an admin before going live. Chat is consent-gated — only unlocked after both users mutually accept interest.

## Monorepo Structure

pnpm + Turborepo monorepo with two apps and one shared package:

- `apps/web` — Next.js 14 (App Router) frontend, PWA, deployed on Vercel
- `apps/api` — Express + Socket.io backend, deployed on Railway/EC2 (port 4000)
- `packages/db` — Shared Prisma client + schema (PostgreSQL via Supabase)

## Commands

```bash
# From repo root — runs all apps in parallel via Turborepo
pnpm dev
pnpm build
pnpm lint
pnpm format

# Target a specific app
pnpm --filter @nammal/web dev       # Next.js on :3000
pnpm --filter @nammal/api dev       # Express on :4000

# Database (run from packages/db or use filter)
pnpm --filter @nammal/db db:generate   # Regenerate Prisma client after schema changes
pnpm --filter @nammal/db db:migrate    # Run migrations (dev)
pnpm --filter @nammal/db db:push       # Push schema without migration (prototyping)
pnpm --filter @nammal/db db:studio     # Open Prisma Studio
```

## Environment Setup

Copy `.env.example` to `.env` in both `apps/api/` and `packages/db/`. Required variables:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | BullMQ job queue + rate limiting |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Access (15min) + refresh (30d) tokens |
| `FAST2SMS_API_KEY` | SMS OTP delivery |
| `CLOUDINARY_*` | Profile photo storage |
| `NEXT_PUBLIC_FIREBASE_*` | Web push notifications (FCM) |
| `WEB_URL` / `API_URL` / `NEXT_PUBLIC_API_URL` | Cross-service URLs |

## Architecture

### Web App (`apps/web`)

Next.js 14 App Router with three route groups:

- `(auth)` — `/login`, `/register` — unauthenticated only
- `(main)` — `/browse`, `/interests`, `/chat`, `/pending` — requires auth cookie
- `admin` — `/admin`, `/admin/queue`, `/admin/reports` — requires admin cookie

**Auth model**: Cookie-based (`nammal_session` + `nammal_admin`). `middleware.ts` guards routes by checking these cookies — no server-side JWT verification in middleware, just presence check.

**State**: Zustand store at `src/store/auth.ts`. API calls via axios wrapper at `src/lib/api.ts`.

### API Server (`apps/api`)

Express server with Socket.io on the same HTTP server instance. Route structure mirrors the REST API spec. The `io` instance is exported from `src/index.ts` and imported in socket handlers.

Key files:
- `src/middleware/auth.ts` — JWT verification middleware for protected routes
- `src/jobs/expireInterests.ts` — BullMQ scheduler that auto-expires interests after 7 days
- `src/socket/index.ts` — Socket.io event handlers for real-time chat
- `src/lib/cloudinary.ts` — Photo upload via Multer → Cloudinary pipeline

### Database (`packages/db`)

Prisma schema at `packages/db/prisma/schema.prisma`. The package exports a singleton PrismaClient from `src/index.ts`, consumed by `@nammal/api` as a workspace dependency.

**Key state machines:**

Profile status: `PENDING → VERIFIED | REJECTED → SUSPENDED | DELETED`
Interest status: `PENDING → ACCEPTED (creates Chat) | DECLINED (30d cooldown) | EXPIRED | WITHDRAWN`

**Critical constraints enforced at DB level:**
- `Interest.expiresAt` = `sentAt + 7 days` (set on create)
- `InterestCooldown` composite PK `(senderId, receiverId)` — one cooldown record per pair
- `Chat` has a unique constraint on `interestId` — one chat per accepted interest

## Domain Rules (enforce in code)

- Only verified users (status `VERIFIED`) can browse or send interest
- Users can only send interest to the **opposite gender**
- Max 10 pending sent interests at a time (Phase 1 spam prevention)
- Chat is only accessible if a `Chat` record exists linking both users via an accepted `Interest`
- Photo changes trigger profile back to `PENDING` status for re-verification
- Admin actions must be logged to `AdminAction_` table with reason
