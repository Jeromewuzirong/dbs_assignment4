# Repo Guide For Agents

## Goal

Build and maintain a minimal realtime weather dashboard that demonstrates:

- monorepo structure
- Supabase Auth
- Supabase Realtime
- a polling worker
- a deployed Next.js frontend

## Directory Map

- `apps/web`: Next.js app router frontend
- `apps/worker`: polling worker
- `supabase/migrations`: SQL schema and seed data
- `.mcp.json`: Supabase MCP example config

## Editing Rules

- Keep the architecture simple.
- Prefer server components unless client state is required.
- Keep worker logic in small functions.
- Do not move business logic into unnecessary abstractions.
- Treat `weather_snapshots` as append-only.

## Commands

- Install: `npm install`
- Frontend dev: `npm run dev:web`
- Worker dev: `npm run dev:worker`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Production build: `npm run build`

## File Intent

- `apps/web/app/page.tsx`: authenticated dashboard entrypoint
- `apps/web/components/weather-dashboard.tsx`: client-side realtime UI
- `apps/web/app/actions.ts`: server actions for sign-out and preferences
- `apps/worker/src/index.ts`: polling loop
- `apps/worker/src/openMeteo.ts`: API fetch + normalization
- `supabase/migrations/20260421_init.sql`: full schema, RLS, and seed data
