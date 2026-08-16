import type { FilterKey, FilterOption } from '../types';

export const FILTERS: FilterOption[] = [
  { key: 'all', label: 'All' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
];

export interface DateRange {
  start: Date;
  end: Date;
}

export function getFilterRange(filter: FilterKey): DateRange | null {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (filter === 'all') return null;

  if (filter === 'month') {
    return {
      start: new Date(year, month, 1),
      end: new Date(year, month + 1, 0, 23, 59, 59, 999),
    };
  }

  // week (Mon–Sun)
  const daysSinceMonday = (now.getDay() + 6) % 7;
  const monday = new Date(year, month, now.getDate() - daysSinceMonday);
  const sunday = new Date(year, month, now.getDate() - daysSinceMonday + 6, 23, 59, 59, 999);
  return { start: monday, end: sunday };
}
