import type { GeoPoint } from './geo';

export type FilterKey = 'all' | 'week' | 'month';

export interface FilterOption {
  key: FilterKey;
  label: string;
}

export type PanelState = 'add' | 'trips' | 'library' | null;

export type SheetState = 'hidden' | 'peek' | 'expanded';

export type Status = 'idle' | 'searching' | 'saving' | 'error';

export type ActiveFilterChipType =
  | 'city'
  | 'date'
  | 'bounds'
  | 'viewing'
  | 'place'
  | 'trip'
  | 'attribute';

export interface ActiveFilterChip {
  type: ActiveFilterChipType;
  label: string;
  onClear: () => void;
  onHover?: (hover: boolean) => void;
  onRecenter?: () => void;
}

export type FocusKind = 'place' | 'trip';

export interface FocusEntity {
  kind: FocusKind;
  id: string;
  label: string;
  center: GeoPoint;
  radius: number;
}
