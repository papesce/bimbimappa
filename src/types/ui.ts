export type FilterKey = 'all' | 'week' | 'month'

export interface FilterOption {
  key: FilterKey
  label: string
}

export type PanelState = 'add' | 'list' | null

export type SheetState = 'hidden' | 'peek' | 'expanded'

export type Status = 'idle' | 'searching' | 'saving' | 'error'

export type ActiveFilterChipType = 'city' | 'date' | 'bounds' | 'viewing' | 'attribute'

export interface ActiveFilterChip {
  type: ActiveFilterChipType
  label: string
  onClear: () => void
  onHover?: (hover: boolean) => void
  onRecenter?: () => void
}
