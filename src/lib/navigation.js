export function googleMapsUrl(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}

export function wazeUrl(lat, lng) {
  return `https://www.waze.com/ul?ll=${lat},${lng}&navigate=yes`
}
