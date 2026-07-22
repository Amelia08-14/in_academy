"use client";

import { Fragment, useEffect, useState } from "react";
import { adminApi as api } from "@/lib/adminApi";
import { fileUrl } from "@/lib/fileUrl";

interface Fiche { id: string; fileUrl: string; originalName: string | null }
interface Application {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  speciality: string | null;
  message: string | null;
  cvUrl: string | null;
  status: "PENDING" | "REVIEWED" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  files: Fiche[];
}

const STATUS: Record<Application["status"], { label: string; cls: string }> = {
  PENDING:  { label: "En attente", cls: "pending" },
  REVIEWED: { label: "Étudiée",    cls: "role" },
  ACCEPTED: { label: "Acceptée",   cls: "confirmed" },
  REJECTED: { label: "Refusée",    cls: "cancelled" },
};

export default function AdminCandidaturesPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api.get<Application[]>("/admin/trainer-applications").then(setApps).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const setStatus = async (id: string, status: Application["status"]) => {
    await api.patch(`/admin/trainer-applications/${id}`, { status });
    load();
  };

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title">Candidatures collaborateur</h1>
        <span className="admin-kpi admin-kpi--inline">{apps.length} candidature{apps.length > 1 ? "s" : ""}</span>
      </div>

      {loading && <p className="admin-loading">Chargement…</p>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Candidat</th><th>Spécialité</th><th>Reçu le</th><th>Statut</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {apps.length === 0 && !loading && (
              <tr><td colSpan={5} className="admin-table__empty">Aucune candidature</td></tr>
            )}
            {apps.map((a) => (
              <Fragment key={a.id}>
                <tr>
                  <td>
                    <span className="admin-table__name">{a.firstName} {a.lastName}</span>
                    <span className="admin-table__email">{a.email}{a.phone ? ` · ${a.phone}` : ""}</span>
                  </td>
                  <td style={{ fontSize: 13 }}>{a.speciality ?? <span style={{ color: "var(--border)" }}>—</span>}</td>
                  <td style={{ fontSize: 13 }}>{new Date(a.createdAt).toLocaleDateString("fr-DZ")}</td>
                  <td><span className={`admin-badge admin-badge--${STATUS[a.status].cls}`}>{STATUS[a.status].label}</span></td>
                  <td>
                    <div className="admin-actions">
                      <button className="admin-btn" onClick={() => setExpanded(expanded === a.id ? null : a.id)}>
                        {expanded === a.id ? "Masquer" : "Détails"}
                      </button>
                      <button className="admin-btn admin-btn--confirm" onClick={() => setStatus(a.id, "ACCEPTED")}>Accepter</button>
                      <button className="admin-btn admin-btn--cancel" onClick={() => setStatus(a.id, "REJECTED")}>Refuser</button>
                    </div>
                  </td>
                </tr>
                {expanded === a.id && (
                  <tr className="admin-details-row">
                    <td colSpan={5}>
                      <div className="admin-details">
                        <div className="admin-details__block">
                          <span className="admin-details__label">Message</span>
                          <span className="admin-details__meta">{a.message || "—"}</span>
                        </div>
                        <div className="admin-details__block">
                          <span className="admin-details__label">Documents</span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 6 }}>
                            {a.cvUrl && (
                              <a href={fileUrl(a.cvUrl)} target="_blank" rel="noopener noreferrer" className="admin-file-link">CV</a>
                            )}
                            {a.files.map((f) => (
                              <a key={f.id} href={fileUrl(f.fileUrl)} target="_blank" rel="noopener noreferrer" className="admin-file-link">
                                {f.originalName ?? "Fiche"}
                              </a>
                            ))}
                            {!a.cvUrl && a.files.length === 0 && <span className="admin-details__meta">Aucun document joint.</span>}
                          </div>
                        </div>
                        {a.status !== "REVIEWED" && (
                          <button className="admin-btn" style={{ marginTop: 10 }} onClick={() => setStatus(a.id, "REVIEWED")}>
                            Marquer « Étudiée »
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
