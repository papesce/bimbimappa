-- Run this in your Supabase project's SQL editor
-- Dashboard → SQL Editor → New query → paste → Run

create table if not exists places (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  address     text not null,
  lat         double precision not null,
  lng         double precision not null,
  notes       text,
  source_url  text,
  created_at  timestamptz default now()
);

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
