-- Category = semantic type shown as the marker color + glyph on the map.
-- One consistent pin silhouette; category varies color and inner icon.
-- Value is nullable: existing rows without a category fall back to "other".

alter table places add column if not exists category text;

alter table places add constraint places_category_check
  check (category is null or category in ('home', 'museum', 'shopping', 'food', 'park', 'other'));

create index if not exists places_category_idx on places (category);
