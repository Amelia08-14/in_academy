// Panier de devis B2B (tâche 7) — stocké en localStorage, réactif via un event custom.
export interface QuoteCartItem {
  formationId: string;
  title: string;
  participants: number;
}

const KEY = "quote_cart";
const EVENT = "quotecartchange";

function read(): QuoteCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as QuoteCartItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: QuoteCartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT));
}

export const quoteCart = {
  event: EVENT,
  list: read,
  count: () => read().length,
  has: (formationId: string) => read().some((i) => i.formationId === formationId),
  add(item: QuoteCartItem) {
    const items = read();
    if (items.some((i) => i.formationId === item.formationId)) return;
    write([...items, item]);
  },
  remove(formationId: string) {
    write(read().filter((i) => i.formationId !== formationId));
  },
  setParticipants(formationId: string, participants: number) {
    write(read().map((i) => (i.formationId === formationId ? { ...i, participants } : i)));
  },
  clear() {
    write([]);
  },
};
