-- Add "farm" as a valid category (educative farms / granjas educativas).
-- The old check constraint is dropped and re-added with the new value included.

alter table places drop constraint if exists places_category_check;

alter table places add constraint places_category_check
  check (category is null or category in ('home', 'museum', 'shopping', 'food', 'park', 'farm', 'other'));
