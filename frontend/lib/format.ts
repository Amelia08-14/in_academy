export function formatDa(price: number | null | undefined): string | null {
  if (price == null) return null;
  return `${price.toLocaleString("fr-DZ")} DA`;
}

export function formatDurationDays(duration: string | null | undefined): string | null {
  if (!duration) return null;
  const trimmed = duration.trim();
  const match = trimmed.match(/^(\d+)\s*(j|jour|jours)?$/i);
  if (!match) return trimmed;

  const days = match[1]?.padStart(2, "0");
  return `${days} jours`;
}
