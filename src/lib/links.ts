import type { Place, PlaceLink } from '../types';

export type Platform = 'instagram' | 'tiktok' | 'youtube';

const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
};

export function inferPlatform(url: string | null | undefined): Platform | null {
  if (!url) return null;
  const host = url.toLowerCase();
  if (host.includes('instagram.com') || host.includes('instagr.am')) return 'instagram';
  if (host.includes('tiktok.com')) return 'tiktok';
  if (host.includes('youtube.com') || host.includes('youtu.be')) return 'youtube';
  return null;
}

export function inferLinkLabel(url: string): string {
  const platform = inferPlatform(url);
  return platform ? PLATFORM_LABELS[platform] : 'Website';
}

// Returns [{ id, url, label, is_primary }]. Prefers the new `links` array and
// falls back to the legacy single `source_url` column.
export function getLinks(place: Place | null | undefined): PlaceLink[] {
  if (!place) return [];
  if (Array.isArray(place.links) && place.links.length > 0) {
    return place.links.filter(l => l?.url);
  }
  if (place.source_url) {
    return [{ id: 'legacy', url: place.source_url, label: 'Source', is_primary: true }];
  }
  return [];
}

export function getPrimaryLink(place: Place | null | undefined): PlaceLink | null {
  const links = getLinks(place);
  return links.find(l => l.is_primary) || links[0] || null;
}
