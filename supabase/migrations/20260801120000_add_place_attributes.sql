alter table places add column if not exists amenities text[] not null default '{}'::text[];
alter table places add column if not exists price_tier smallint;
alter table places add column if not exists priority smallint;
alter table places add column if not exists rating smallint;

alter table places drop constraint if exists places_price_tier_check;
alter table places add constraint places_price_tier_check
  check (price_tier is null or price_tier between 1 and 4);

alter table places drop constraint if exists places_priority_check;
alter table places add constraint places_priority_check
  check (priority is null or priority between 1 and 3);

alter table places drop constraint if exists places_rating_check;
alter table places add constraint places_rating_check
  check (rating is null or rating between 1 and 5);

create index if not exists places_amenities_gin_idx on places using gin (amenities);
