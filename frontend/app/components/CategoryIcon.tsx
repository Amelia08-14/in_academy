const ICONS: Record<string, string> = {
  "transport-logistique": "M1 3h13v13H1zM14 8h4l3 3v5h-7V8zM5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17.5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  "commerce-ventes": "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0",
  "hse-securite": "M12 2 3 6v6c0 5 4 9 9 10 5-1 9-5 9-10V6z",
  "finance-comptabilite": "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  "achats-international": "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2c2.5 2.7 4 6.3 4 10s-1.5 7.3-4 10c-2.5-2.7-4-6.3-4-10s1.5-7.3 4-10z",
  "it-digital": "M4 4h16v12H4zM8 20h8M12 16v4",
  "rh-management": "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  "juridique-conformite": "M12 2 3 6v3l9 4 9-4V6zM3 9v9M21 9v9M3 18h18M12 13v9",
  "maritime-import-export": "M12 2v6M9 5h6M5 14a7 7 0 0 0 14 0h-3l-1 3-2-6-2 6-1-3H5z",
  "qualite-production": "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM9 12l2 2 4-4",
  langues: "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z",
  audit: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
};

const DEFAULT_ICON = "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z";

export default function CategoryIcon({ slug, size = 64 }: { slug: string; size?: number }) {
  const d = ICONS[slug] ?? DEFAULT_ICON;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
