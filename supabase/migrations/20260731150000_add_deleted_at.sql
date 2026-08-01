-- Soft delete: deletes become an UPDATE on `deleted_at` instead of a hard DELETE.
-- The app hides deleted rows (fetch filters `deleted_at is null`) and offers an
-- undo toast that clears the flag. Optionally purge old rows with:
--   delete from places where deleted_at < now() - interval '30 days';

alter table places add column if not exists deleted_at timestamptz;

create index if not exists places_deleted_at_idx on places (deleted_at);
