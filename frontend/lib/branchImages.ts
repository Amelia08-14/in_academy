// Photos réelles par domaine de formation, déposées dans public/branches/.
// Couvre les 12 secteurs principaux + les 4 branches "métiers" (isMetier: true).
const FILES: Record<string, string> = {
  "transport-logistique": "Transport & Logistique.png",
  "commerce-ventes": "Commerce & Ventes.png",
  "hse-securite": "HSE & Sécurité.png",
  "finance-comptabilite": "Finance & Comptabilité.png",
  "achats-international": "Achats & International.png",
  "it-digital": "IT & Digital.png",
  "rh-management": "RH & Management.png",
  "juridique-conformite": "Juridique & Conformité.png",
  "maritime-import-export": "Maritime & ImportExport.png",
  "qualite-production": "Qualité & Production.png",
  langues: "Langues.png",
  audit: "Audit.png",
  // Branches "métiers"
  barber: "Barber.png",
  coiffure: "Coiffure.png",
  esthetique: "Esthétique.png",
  onglerie: "Onglerie.png",
};

export function branchImage(slug: string): string | null {
  const file = FILES[slug];
  return file ? `/branches/${encodeURIComponent(file)}` : null;
}
