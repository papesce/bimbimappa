-- Multiple source links per place, one marked primary.
-- Legacy single source_url stays for backward compat; backfilled into links.

alter table places add column if not exists links jsonb not null default '[]';

update places
set links = jsonb_build_array(
  jsonb_build_object(
    'id', gen_random_uuid()::text,
    'url', source_url,
    'label', 'Source',
    'is_primary', true
  )
)
where source_url is not null
  and source_url <> ''
  and (links is null or jsonb_array_length(links) = 0);
