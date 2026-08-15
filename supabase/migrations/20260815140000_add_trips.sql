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
