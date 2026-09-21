import type { PricePeriod } from "@/lib/format";

// Session telle que renvoyée par GET /api/sessions/:id (page de détail / landing métier).
export interface PublicSession {
  id: string;
  title: string;
  description: string | null;
  descriptionAr: string | null;
  coverImageUrl: string | null;
  posterImageUrl: string | null;
  duration: string | null;
  price: number | null;
  pricePeriod: PricePeriod;
  startDate: string;
  location: string | null;
  spotsLeft: number;
  maxCapacity: number;
  isOpen: boolean;
  category: { slug: string; name: string; isMetier: boolean };
  formation: {
    title: string;
    description: string | null;
    descriptionAr: string | null;
    duration: string | null;
    price: number | null;
  } | null;
}

// Niveaux d'étude proposés dans le formulaire d'inscription directe.
export const EDUCATION_LEVELS = [
  "Niveau primaire",
  "Niveau moyen (BEM)",
  "Niveau secondaire",
  "Baccalauréat",
  "Formation professionnelle (CAP / BT / TS)",
  "Bac +2 / Bac +3 (DEUA, Licence)",
  "Bac +5 et plus (Master, Ingénieur)",
  "Autre",
] as const;
