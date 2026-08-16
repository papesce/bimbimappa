import type { LucideIcon } from 'lucide-react';
import {
  CircleDot,
  DraftingCompass,
  Drama,
  FerrisWheel,
  Home,
  Landmark,
  Leaf,
  Mic2,
  Mountain,
  ShoppingBag,
  Tent,
  Tractor,
  Utensils,
} from 'lucide-react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { PlaceCategory } from '../types';

export interface CategoryConfig {
  key: PlaceCategory;
  label: string;
  color: string;
  icon: LucideIcon;
}

// One consistent marker silhouette, varied by color + glyph so the map stays readable.
export const CATEGORIES: CategoryConfig[] = [
  { key: 'home', label: 'Home', color: '#4A90D9', icon: Home },
  { key: 'museum', label: 'Museum', color: '#8B5CF6', icon: Landmark },
  { key: 'shopping', label: 'Shopping', color: '#F59E0B', icon: ShoppingBag },
  { key: 'event_venue', label: 'Event Venue', color: '#14B8A6', icon: Tent },
  { key: 'maze', label: 'Maze', color: '#0F766E', icon: DraftingCompass },
  { key: 'food', label: 'Food', color: '#EF4444', icon: Utensils },
  { key: 'park', label: 'Park', color: '#22C55E', icon: Leaf },
  { key: 'farm', label: 'Farm', color: '#84CC16', icon: Tractor },
  { key: 'adventure_park', label: 'Adventure Park', color: '#0EA5E9', icon: Mountain },
  { key: 'fun_center', label: 'Fun Center', color: '#EC4899', icon: FerrisWheel },
  { key: 'theater', label: 'Theater', color: '#A855F7', icon: Drama },
  { key: 'auditorium', label: 'Auditorium', color: '#6366F1', icon: Mic2 },
  { key: 'other', label: 'Other', color: '#FF6B6B', icon: CircleDot },
];

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.key, c])) as Record<
  PlaceCategory,
  CategoryConfig
>;

export function getCategory(category: PlaceCategory | null | undefined): CategoryConfig {
  return (category && CATEGORY_MAP[category]) || CATEGORY_MAP.other;
}

// SVG string for Leaflet divIcon html — same glyph as the React icon, rendered server-style.
export function categoryIconHtml(
  category: PlaceCategory | null | undefined,
  size = 13,
  color = '#ffffff',
  strokeWidth = 2.5,
): string {
  const { icon: Icon } = getCategory(category);
  return renderToStaticMarkup(createElement(Icon, { size, color, strokeWidth }));
}
