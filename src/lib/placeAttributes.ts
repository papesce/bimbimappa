import type { PriceTier, PriorityLevel } from '../types';

export const AMENITY_OPTIONS = [
  'has_pool',
  'has_maze',
  'outdoor',
  'indoor',
  'stroller_friendly',
  'parking',
  'free_parking',
  'food_on_site',
  'restrooms',
  'shade',
  'lodge',
] as const;

export const PRICE_TIER_LABELS: Record<NonNullable<PriceTier>, string> = {
  1: '$',
  2: '$$',
  3: '$$$',
  4: '$$$$',
};

export const PRIORITY_LABELS: Record<NonNullable<PriorityLevel>, string> = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
};

export function formatAmenity(amenity: string): string {
  return amenity.replace(/_/g, ' ');
}

export function formatPriceTier(priceTier: PriceTier | null | undefined): string {
  return priceTier ? PRICE_TIER_LABELS[priceTier] : 'Unspecified';
}

export function formatPriority(priority: PriorityLevel | null | undefined): string {
  return priority ? PRIORITY_LABELS[priority] : 'Unspecified';
}

export function formatRating(rating: number | null | undefined): string {
  return rating ? `${rating.toFixed(1)} / 5` : 'Unspecified';
}
