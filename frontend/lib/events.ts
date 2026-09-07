// Types partagés entre la liste "Nos Events" et la page de détail d'un événement.

export type RegistrationStatus = "PENDING" | "CONFIRMED" | "REJECTED";

export interface EventPhoto { id: string; photoUrl: string }

export interface EventItem {
  id: string;
  slug: string;
  title: string;
  eventDate: string;
  location: string | null;
  summary: string | null;
  capacity: number | null;
  photos: EventPhoto[];
  registeredCount: number;
  myStatus: RegistrationStatus | null;
}

export interface Account {
  email: string;
  learnerProfile: { firstName: string; lastName: string; phone: string | null; jobTitle: string | null } | null;
}

export function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}
