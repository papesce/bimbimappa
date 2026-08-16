import { supabase } from './supabase';

const BUCKET = 'place-photos';

export async function uploadPlacePhoto(placeId: string, file: File): Promise<string> {
  const ext =
    file.name
      .split('.')
      .pop()
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${placeId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deletePlacePhoto(photoUrl: string): Promise<void> {
  const path = extractStoragePath(photoUrl);
  if (!path) return;
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}

function extractStoragePath(photoUrl: string): string | null {
  try {
    const url = new URL(photoUrl);
    const marker = `/object/public/${BUCKET}/`;
    const idx = url.pathname.indexOf(marker);
    if (idx === -1) return null;
    return url.pathname.slice(idx + marker.length);
  } catch {
    return null;
  }
}
