export function isValidProjectDateRange(startDate?: string, endDate?: string): boolean {
  if (!startDate || !endDate) return true;
  return endDate >= startDate;
}

export function formatProjectDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function formatProjectDateRange(startDate?: string, endDate?: string): string | null {
  if (!startDate && !endDate) return null;
  if (startDate && endDate) return `${formatProjectDate(startDate)} – ${formatProjectDate(endDate)}`;
  if (startDate) return `From ${formatProjectDate(startDate)}`;
  return `Until ${formatProjectDate(endDate!)}`;
}
