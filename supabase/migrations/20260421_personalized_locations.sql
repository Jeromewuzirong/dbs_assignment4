create table if not exists public.user_tracked_locations (
  user_id uuid not null references auth.users(id) on delete cascade,
  location_id uuid not null references public.tracked_locations(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, location_id)
);

create index if not exists user_tracked_locations_location_idx
  on public.user_tracked_locations (location_id);

alter table public.user_tracked_locations enable row level security;

drop policy if exists "users can read own tracked locations" on public.user_tracked_locations;
create policy "users can read own tracked locations"
  on public.user_tracked_locations
  for select
  using (auth.uid() = user_id);

drop policy if exists "users can insert own tracked locations" on public.user_tracked_locations;
create policy "users can insert own tracked locations"
  on public.user_tracked_locations
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "users can delete own tracked locations" on public.user_tracked_locations;
create policy "users can delete own tracked locations"
  on public.user_tracked_locations
  for delete
  using (auth.uid() = user_id);

drop policy if exists "authenticated users can insert tracked locations" on public.tracked_locations;
create policy "authenticated users can insert tracked locations"
  on public.tracked_locations
  for insert
  to authenticated
  with check (true);

insert into public.user_tracked_locations (user_id, location_id)
select user_id, location_id
from public.user_preferences
where location_id is not null
on conflict (user_id, location_id) do nothing;
