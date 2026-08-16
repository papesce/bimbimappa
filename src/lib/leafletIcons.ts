import L from 'leaflet';
import type { PlaceCategory } from '../types';
import { categoryIconHtml, getCategory } from './categories';

// Fix Leaflet's broken default icon paths in Vite
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export type MarkerVariant =
  | 'normal'
  | 'new'
  | 'hover'
  | 'normal-dimmed'
  | 'new-dimmed'
  | 'hover-dimmed';

const iconCache: Record<string, L.DivIcon> = {};

// One pin silhouette for every place; category varies color + inner glyph,
// while `variant` overlays state (new pulse ring / hover glow). Keeps
// "what kind of place" and "what the user is doing" as separate concerns.
// Icons are cached per category+variant so markers keep stable identity.
export function makePlaceIcon(
  category: PlaceCategory | null,
  variant: MarkerVariant = 'normal',
  tripIndex?: number,
): L.DivIcon {
  const isDimmed = variant.endsWith('-dimmed');
  const cacheKey = `${category ?? 'other'}|${variant}|${tripIndex ?? ''}`;
  const cached = iconCache[cacheKey];
  if (cached) return cached;

  const { color } = getCategory(category);
  const baseVariant = isDimmed
    ? (variant.replace('-dimmed', '') as 'normal' | 'new' | 'hover')
    : variant;
  const size = baseVariant === 'new' ? 36 : 32;
  const ring =
    baseVariant !== 'normal'
      ? `<div class="new-marker-ring" style="background:${color}59;"></div>`
      : '';
  const shadow =
    baseVariant === 'new'
      ? 'box-shadow: 0 2px 12px rgba(0,0,0,0.4);'
      : baseVariant === 'hover'
        ? `box-shadow: 0 0 0 4px ${color}59, 0 2px 12px rgba(0,0,0,0.35);`
        : 'box-shadow: 0 2px 8px rgba(0,0,0,0.3);';
  const badge = categoryIconHtml(category, size >= 36 ? 15 : 13);

  const dimStyle = isDimmed ? 'opacity:0.35;filter:saturate(0.4);' : '';

  const tripBadge =
    tripIndex != null
      ? `<div style="
          position:absolute;top:-2px;right:-2px;
          width:20px;height:20px;border-radius:50%;
          background:white;border:1px solid rgba(0,0,0,0.15);
          box-shadow:0 1px 3px rgba(0,0,0,0.25);
          z-index:2;display:flex;align-items:center;justify-content:center;
          font-family:system-ui,-apple-system,sans-serif;
          font-size:11px;font-weight:600;color:#1a1a1a;
          line-height:1;
        ">${tripIndex}</div>`
      : '';

  const icon = L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;${dimStyle}">
        ${ring}
        <div style="
          background:${color};
          width:${size}px;height:${size}px;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          border:3px solid white;
          ${shadow}
          position:relative;z-index:1;
          display:flex;align-items:center;justify-content:center;
        ">
          <span style="transform:rotate(45deg);display:flex;align-items:center;justify-content:center;">
            ${badge}
          </span>
        </div>
        ${tripBadge}
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -(size + 4)],
  });
  iconCache[cacheKey] = icon;
  return icon;
}

export const centerIcon = L.divIcon({
  className: '',
  html: `<div style="
    width: 28px;
    height: 28px;
    position: relative;
  ">
    <div style="
      position: absolute;
      top: 50%; left: 50%;
      width: 20px; height: 20px;
      margin: -10px 0 0 -10px;
      border: 2.5px solid #4A90D9;
      border-radius: 50%;
      background: rgba(74,144,217,0.15);
    "></div>
    <div style="
      position: absolute;
      top: 50%; left: 50%;
      width: 8px; height: 8px;
      margin: -4px 0 0 -4px;
      background: #4A90D9;
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    "></div>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
});

// Coral marker for the AddPlacePanel mini-map — matches the main map, slightly smaller
export const previewIcon = L.divIcon({
  className: '',
  html: `<div style="
    background:#FF6B6B;width:22px;height:22px;
    border-radius:50% 50% 50% 0;transform:rotate(-45deg);
    border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});
