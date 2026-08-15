alter table places add column if not exists photo_url text;

-- Public bucket for place photos: stable public URLs (no signed-URL expiry),
-- matching the app's security model — RLS is open, the household token gates the UI.
insert into storage.buckets (id, name, public)
values ('place-photos', 'place-photos', true)
on conflict (id) do nothing;

create policy "Public read place photos" on storage.objects
  for select using (bucket_id = 'place-photos');

create policy "Public insert place photos" on storage.objects
  for insert with check (bucket_id = 'place-photos');

create policy "Public update place photos" on storage.objects
  for update using (bucket_id = 'place-photos');

create policy "Public delete place photos" on storage.objects
  for delete using (bucket_id = 'place-photos');
