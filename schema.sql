-- Run this in your Supabase project's SQL editor
-- Dashboard → SQL Editor → New query → paste → Run

create table if not exists places (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  address     text not null,
  lat         double precision not null,
  lng         double precision not null,
  notes       text,
  source_url  text,           -- legacy single link, migrated into `links`
  links       jsonb default '[]',  -- [{ id, url, label, is_primary }]
  category    text,  -- marker color + glyph; values driven by src/lib/categories.ts, unknown values fall back to "other"
  amenities   text[] not null default '{}'::text[],
  price_tier  smallint,
  priority    smallint,
  rating      smallint,
  date_from   date,
  date_to     date,
  photo_url   text,              -- public Supabase Storage URL for the place photo
  deleted_at  timestamptz,       -- soft delete: set to now() instead of DELETE
  created_at  timestamptz default now()
);

-- Place photos are stored in the public 'place-photos' bucket (see migration
-- 20260815120000_add_photo_url.sql). No extra schema needed here.

-- Allow anyone with the anon key to read and write.
-- The real "auth" is the VITE_HOUSEHOLD_TOKEN in the client.
alter table places enable row level security;

create policy "Public read" on places
  for select using (true);

create policy "Public insert" on places
  for insert with check (true);

create policy "Public delete" on places
  for delete using (true);

create policy "Public update" on places
  for update using (true);

create table if not exists trips (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  notes       text,
  priority    smallint not null default 1, -- 1=High, 2=Medium, 3=Low
  place_ids   uuid[] not null default '{}'::uuid[],
  target_date text,
  deleted_at  timestamptz,
  created_at  timestamptz default now()
);

alter table trips enable row level security;

create policy "Public read trips" on trips
  for select using (true);

create policy "Public insert trips" on trips
  for insert with check (true);

create policy "Public delete trips" on trips
  for delete using (true);

create policy "Public update trips" on trips
  for update using (true);

