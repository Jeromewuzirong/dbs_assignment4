# Week 4 Weather Dashboard Architecture

This repository is the simplest multi-service realtime system that satisfies the assignment.

## Services

- `apps/web`: Next.js frontend deployed to Vercel.
- `apps/worker`: Node.js background worker deployed to Railway.
- Supabase: Postgres, Auth, and Realtime.
- Open-Meteo: external live weather source.

## Data Flow

1. The worker reads tracked cities from Supabase.
2. The worker polls Open-Meteo current weather for each tracked city on an interval.
3. The worker inserts a new row into `public.weather_snapshots`.
4. The frontend reads the latest snapshot for the signed-in user’s preferred city.
5. Supabase Realtime pushes new `weather_snapshots` inserts to the browser.
6. The React client updates the dashboard without a page refresh.

## Personalization

- Users sign in with Supabase Auth email magic links.
- Each user has one row in `public.user_preferences`.
- Preferences store:
  - preferred location
  - preferred temperature unit (`c` or `f`)

## Why This Design

- It is easy to deploy.
- It keeps write access inside the worker only.
- The frontend only needs the anon key.
- Realtime is naturally modeled as inserts into a snapshots table.
- Open-Meteo does not require an API key, which reduces setup friction.

## Environment Variables

- Web:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Worker:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `POLL_INTERVAL_MS`

## Database Tables

- `tracked_locations`: fixed cities the worker polls.
- `weather_snapshots`: append-only weather history used for realtime.
- `user_preferences`: per-user personalization.

## Realtime

- Supabase Realtime is enabled for `public.weather_snapshots`.
- The client subscribes to inserts filtered by the active `location_id`.

## Local Development Order

1. Apply `supabase/migrations/20260421_init.sql` in Supabase SQL Editor.
2. Install dependencies with `npm install`.
3. Run the frontend with `npm run dev:web`.
4. Run the worker with `npm run dev:worker`.

##
