export function formatDateRange(dateFrom: string | null, dateTo: string | null): string | null {
  if (!dateFrom) return null;
  const from = new Date(`${dateFrom}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  if (!dateTo || dateTo === dateFrom) return from;
  const to = new Date(`${dateTo}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  return `${from}–${to}`;
}
