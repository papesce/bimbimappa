export function toTitleCase(str: string): string {
  if (str === str.toUpperCase() && str !== str.toLowerCase()) {
    return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }
  return str;
}
