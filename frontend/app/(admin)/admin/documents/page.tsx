"use client";

import { useEffect, useState } from "react";
import { adminApi as api } from "@/lib/adminApi";
import { fileUrl } from "@/lib/fileUrl";

interface LearnerProfile { firstName: string; lastName: string }
interface Company { raisonSociale: string }
interface CompanyProfile { company: Company }
interface DocUser { email: string; learnerProfile: LearnerProfile | null; companyAdmin: CompanyProfile | null }
interface DocEnrollment { session: { title: string } | null; formation: { title: string } | null }
interface Doc {
  id: string;
  type: "RECU" | "DOSSIER_ADMIN";
  fileUrl: string;
  originalName: string | null;
  createdAt: string;
  user: DocUser | null;
  enrollment: DocEnrollment | null;
}

const TABS = [
  { key: "all", label: "Tous" },
  { key: "RECU", label: "Reçus de paiement" },
  { key: "DOSSIER_ADMIN", label: "Dossiers administratifs" },
] as const;

export default function AdminDocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("all");

  useEffect(() => {
    api.get<Doc[]>("/admin/documents").then(setDocs).finally(() => setLoading(false));
  }, []);

  const filtered = tab === "all" ? docs : docs.filter((d) => d.type === tab);

  const who = (d: Doc) =>
    d.user?.companyAdmin?.company.raisonSociale ??
    (d.user?.learnerProfile ? `${d.user.learnerProfile.firstName} ${d.user.learnerProfile.lastName}` : d.user?.email ?? "—");

  const forWhat = (d: Doc) =>
    d.enrollment?.session?.title ?? d.enrollment?.formation?.title ?? "—";

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title">Documents reçus</h1>
        <span className="admin-kpi admin-kpi--inline">{docs.length} document{docs.length > 1 ? "s" : ""}</span>
      </div>

      <div className="admin-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`admin-tab${tab === t.key ? " admin-tab--active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            <span className="admin-tab__count">
              {t.key === "all" ? docs.length : docs.filter((d) => d.type === t.key).length}
            </span>
          </button>
        ))}
      </div>

      {loading && <p className="admin-loading">Chargement…</p>}

      <div className="admin-table-wrap" style={{ marginTop: 16 }}>
        <table className="admin-table">
          <thead>
            <tr><th>Type</th><th>Déposé par</th><th>Formation liée</th><th>Fichier</th><th>Date</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 && !loading && (
              <tr><td colSpan={5} className="admin-table__empty">Aucun document</td></tr>
            )}
            {filtered.map((d) => (
              <tr key={d.id}>
                <td>
                  <span className={`dashboard-doc__badge dashboard-doc__badge--${d.type === "RECU" ? "recu" : "dossier"}`}>
                    {d.type === "RECU" ? "Reçu" : "Dossier"}
                  </span>
                </td>
                <td>
                  <span className="admin-table__name">{who(d)}</span>
                  <span className="admin-table__email">{d.user?.email}</span>
                </td>
                <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{forWhat(d)}</td>
                <td>
                  <a href={fileUrl(d.fileUrl)} target="_blank" rel="noopener noreferrer" className="admin-file-link">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                    </svg>
                    {d.originalName ?? "Ouvrir"}
                  </a>
                </td>
                <td style={{ fontSize: 13 }}>{new Date(d.createdAt).toLocaleDateString("fr-DZ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
