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

export type PricePeriod = "TOTAL" | "MONTH";

// "35 000 DA" ou "35 000 DA / mois" selon la périodicité du tarif de la session.
export function formatPrice(price: number | null | undefined, period: PricePeriod | undefined): string | null {
  const base = formatDa(price);
  if (!base) return null;
  return period === "MONTH" ? `${base} / mois` : base;
}

// Vrai si le texte est majoritairement en écriture arabe (→ affichage RTL automatique).
export function isArabicText(text: string | null | undefined): boolean {
  if (!text) return false;
  const arabic = (text.match(/[\u0600-\u06FF\u0750-\u077F]/g) ?? []).length;
  const latin = (text.match(/[A-Za-zÀ-ÿ]/g) ?? []).length;
  return arabic > latin;
}
