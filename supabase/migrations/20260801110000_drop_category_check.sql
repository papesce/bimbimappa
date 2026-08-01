-- Categories are driven by the app config in src/lib/categories.ts.
-- Dropping the CHECK constraint means adding/removing categories is a
-- code-only change — no migration required.
-- Unknown values fall back to "other" in the client (getCategory).

alter table places drop constraint if exists places_category_check;
