import type { RecentCity } from '../types';

const RECENT_KEY = 'bimbimappa-recent-cities';
const MAX_RECENT = 10;

export function loadRecent(): RecentCity[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as RecentCity[]) : [];
  } catch {
    return [];
  }
}

export function saveRecent(list: RecentCity[]): void {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
  } catch {
    /* storage full — ignore */
  }
}
