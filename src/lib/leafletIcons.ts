import L from 'leaflet'

// Fix Leaflet's broken default icon paths in Vite
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export const customIcon = L.divIcon({
  className: '',
  html: `<div style="
    background: #FF6B6B;
    width: 32px;
    height: 32px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -36],
})

export const newIcon = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:36px;height:36px;">
      <div class="new-marker-ring"></div>
      <div style="
        background: #FF6B6B;
        width: 36px;
        height: 36px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 12px rgba(255,107,107,0.6);
        position: relative;
        z-index: 1;
      "></div>
    </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -40],
})

// Highlighted marker — used when hovering the "Viewing" chip so the viewed
// place stands out on the map (same pulse ring as the new-place marker).
export const hoverIcon = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:36px;height:36px;">
      <div class="new-marker-ring"></div>
      <div style="
        background: #FF6B6B;
        width: 36px;
        height: 36px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 0 0 4px rgba(255,107,107,0.35), 0 2px 12px rgba(255,107,107,0.6);
        position: relative;
        z-index: 1;
      "></div>
    </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -40],
})

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
})

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
})
