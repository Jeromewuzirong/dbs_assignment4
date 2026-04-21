create extension if not exists pgcrypto;

create table if not exists public.tracked_locations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  latitude numeric(8, 4) not null,
  longitude numeric(8, 4) not null,
  timezone text not null default 'auto',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.weather_snapshots (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.tracked_locations(id) on delete cascade,
  observed_at timestamptz not null,
  temperature_c numeric(5, 2) not null,
  apparent_temperature_c numeric(5, 2) not null,
  wind_speed_kph numeric(6, 2) not null,
  weather_code integer not null,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  location_id uuid references public.tracked_locations(id) on delete set null,
  temperature_unit text not null default 'c' check (temperature_unit in ('c', 'f')),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists weather_snapshots_location_observed_idx
  on public.weather_snapshots (location_id, observed_at desc);

create index if not exists weather_snapshots_created_idx
  on public.weather_snapshots (created_at desc);

alter table public.tracked_locations enable row level security;
alter table public.weather_snapshots enable row level security;
alter table public.user_preferences enable row level security;

drop policy if exists "tracked_locations are readable by everyone" on public.tracked_locations;
create policy "tracked_locations are readable by everyone"
  on public.tracked_locations
  for select
  using (true);

drop policy if exists "weather_snapshots are readable by everyone" on public.weather_snapshots;
create policy "weather_snapshots are readable by everyone"
  on public.weather_snapshots
  for select
  using (true);

drop policy if exists "users can read own preferences" on public.user_preferences;
create policy "users can read own preferences"
  on public.user_preferences
  for select
  using (auth.uid() = user_id);

drop policy if exists "users can insert own preferences" on public.user_preferences;
create policy "users can insert own preferences"
  on public.user_preferences
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "users can update own preferences" on public.user_preferences;
create policy "users can update own preferences"
  on public.user_preferences
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

insert into public.tracked_locations (slug, name, latitude, longitude, timezone)
values
  ('chicago', 'Chicago', 41.8781, -87.6298, 'America/Chicago'),
  ('new-york', 'New York', 40.7128, -74.0060, 'America/New_York'),
  ('los-angeles', 'Los Angeles', 34.0522, -118.2437, 'America/Los_Angeles'),
  ('dallas', 'Dallas', 32.7767, -96.7970, 'America/Chicago')
on conflict (slug) do update
set
  name = excluded.name,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  timezone = excluded.timezone;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'weather_snapshots'
  ) then
    alter publication supabase_realtime add table public.weather_snapshots;
  end if;
end
$$;
