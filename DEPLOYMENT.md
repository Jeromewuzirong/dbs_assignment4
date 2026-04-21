# Deployment Instructions

This project has three separate setup areas: Supabase, Vercel, and Railway.

## 1. Supabase Setup

Run next:

```bash
npm install
```

Then:

1. Create a new Supabase project.
2. Open SQL Editor.
3. Run the contents of `supabase/migrations/20260421_init.sql`.
4. In Authentication, enable email sign-in.
5. In Authentication URL settings, add:
   - local redirect: `http://localhost:3000/auth/callback`
   - production redirect: `https://YOUR-VERCEL-DOMAIN/auth/callback`

## 2. Local Web App

Create `apps/web/.env.local` or set root shell vars with:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Run next:

```bash
npm run dev:web
```

## 3. Local Worker

Set:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
POLL_INTERVAL_MS=300000
```

Run next:

```bash
npm run dev:worker
```

## 4. Vercel Deployment

1. Import the repository into Vercel.
2. Set the Root Directory to `apps/web`.
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy.
5. Copy the Vercel production URL into Supabase Auth redirect settings.

Run next:

```bash
npm run build --workspace apps/web
```

## 5. Railway Deployment

1. Create a new Railway project from this repository.
2. Keep the deploy root at the repository root.
3. Railway will use `railway.json`.
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `POLL_INTERVAL_MS`
5. Deploy and confirm logs show successful polling.

Run next:

```bash
npm run build --workspace apps/worker
```

## 6. Supabase MCP

Update `.mcp.json` with:

- your Supabase project ref
- your Supabase personal access token

Run next:

```bash
claude mcp list
```
