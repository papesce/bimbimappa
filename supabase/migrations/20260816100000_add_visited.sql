alter table places
  add column visited boolean not null default false;

create index idx_places_visited on places (visited) where deleted_at is null;
