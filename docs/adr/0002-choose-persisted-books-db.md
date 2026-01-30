# ADR 0002 — Choose DB and stack for persisted site data (Books / Reading)

Date: 2026-01-29

Status: Proposed

## Context / Problem
The site currently stores book/reading information in Contentlayer frontmatter (`reading`) and renders it via `BookNote` / `NowReading` components. We want a small, well-structured persistent store (hosted DB) to:

- Support CRUD for Book and BookNote entities behind an authenticated admin flow
- Provide a foundation for future domain growth (ReadingList, tags, user-specific lists)
- Align the implementation with DDD and layered architecture so persistence is an implementation detail

This ADR tracks selection of the first provider/stack and a minimal rollout plan.

## Options considered

1) Supabase (Postgres) + Prisma (recommended)
   - Pros: generous free tier for hobby projects, Postgres feature set, first-party auth (optional), excellent DX and docs, Prisma for type-safe DB client and portable migrations.
   - Cons: managed vendor (migrations are straightforward but provider-specific features may be used if not careful).

2) Neon (serverless Postgres) + Prisma
   - Pros: good serverless model, low-latency burst-friendly.
   - Cons: newer provider; verify dev workflow and migrations.

3) PlanetScale (MySQL serverless) + Prisma
   - Pros: excellent for serverless scaling and branching.
   - Cons: MySQL vs Postgres differences; some queries/features are different.

4) Git-backed persistence (commit JSON/MDX via GitHub API)
   - Pros: zero infra cost, matches editorial flow.
   - Cons: poor support for concurrent writes and frequent updates, unsuitable as the feature set grows.

## Decision
Adopt Supabase (hosted Postgres) + Prisma for initial persistence of the Books/Reading domain.

Rationale:
- Matches the repo's current Next.js + TypeScript stack and Contentlayer editorial model.
- Prisma provides a strongly-typed repository/persistence layer and keeps SQL portable.
- Supabase's free tier (and auth) allows fast iteration for a personal site while being production-capable if we scale.

## Consequences
- Implement a domain model (Book, BookNote, ReadingList) with a thin application/service layer and a Prisma-backed repository adapter.
- Add secure admin endpoints (server actions or API routes) for write operations; public read endpoints (ISR or server) will return results from Postgres.
- Introduce runtime secrets for DB connection in environments; add CI checks for migrations.
- Keep domain logic in the domain/application layers to enable switching providers if needed.

## Non-functional requirements (initial)
- Cost: free / hobby-friendly (Supabase free tier)
- Availability: read availability suitable for mostly-static site; caching/ISR will reduce DB load
- Security: only authenticated admin operations can write; secrets in env and not exposed to client
- Operability: local dev experience (docker or Supabase local) and CI migration checks

## Rollout plan (phased)
1. Spike: Add Prisma schema for Book + BookNote and a minimal migration; demonstrate local CRUD against a dev DB. (success: local and hosted dev DB CRUD works)
2. API: Add server-side endpoints / Server Actions + secure admin page to manage books.
3. Replace NowReading data source to read from DB (feature-flagged); keep Contentlayer as fallback.
4. Deploy: add production DB, env secrets, and smoke tests; monitor reads and rollout.

Rollback criteria:
- If DB outages or migration issues cause >1% of requests to fail or unauthorized writes occur, revert to the previous read-only contentlayer rendering and pause DB writes.

## Owner
- Proposed owner: @bryan-debaun

## Related
- Repo issue: bryan-debaun/bryandebaun.dev#46
- Tracker: bryan-debaun/work-tracking#6


*This ADR is intentionally concise — if you want more detail (schema proposals, migration strategy, backup plan), I can expand the ADR and add a migration checklist.*
