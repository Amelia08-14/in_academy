// Photos réelles par domaine de formation, déposées dans public/branches/.
const FILES: Record<string, string> = {
  "transport-logistique": "Transport_&_logistique.png",
  "commerce-ventes": "Commerce_&_vente.png",
  "hse-securite": "Hse_&_hygiene.png",
  "finance-comptabilite": "Finance_&_comptabilite.png",
  "achats-international": "Achat_&_international.png",
  "it-digital": "it_&_digital.png",
  "rh-management": "RH_&_management.png",
  "juridique-conformite": "Juridique_&_conformité.png",
  "maritime-import-export": "Maritime_&_import_export.png",
  "qualite-production": "Qualite_&_prodution.png",
  langues: "Langues.png",
  audit: "Audit.png",
};

export function branchImage(slug: string): string | null {
  const file = FILES[slug];
  return file ? `/branches/${encodeURIComponent(file)}` : null;
}
