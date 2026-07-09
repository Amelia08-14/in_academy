"use client";

import { useEffect, useState } from "react";
import { adminApi as api } from "@/lib/adminApi";

interface Formation { title: string }
interface QuoteItem { id: string; participants: number; preferredDate: string | null; formation: Formation }
interface Company { raisonSociale: string; wilaya: string | null; phone: string | null }
interface Quote {
  id: string;
  status: string;
  message: string | null;
  createdAt: string;
  company: Company;
  items: QuoteItem[];
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  SENT: "Envoyé",
  ACCEPTED: "Accepté",
  REJECTED: "Refusé",
  EXPIRED: "Expiré",
};

export default function AdminDevisPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get<Quote[]>("/admin/quotes")
      .then(setQuotes)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const updateStatus = async (id: string, status: string) => {
    await api.patch(`/admin/quotes/${id}/status`, { status });
    load();
  };

  const pending = quotes.filter((q) => q.status === "PENDING");
  const others = quotes.filter((q) => q.status !== "PENDING");

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title">Devis B2B</h1>
        {pending.length > 0 && (
          <span className="admin-kpi admin-kpi--inline">{pending.length} en attente</span>
        )}
      </div>

      {loading && <p className="admin-loading">Chargement…</p>}

      {pending.length > 0 && (
        <section className="admin-section">
          <h2 className="admin-section__title">Demandes à traiter</h2>
          <div className="admin-quotes-list">
            {pending.map((q) => (
              <div key={q.id} className="admin-quote-card">
                <div className="admin-quote-card__header">
                  <div>
                    <span className="admin-quote-card__company">{q.company.raisonSociale}</span>
                    {q.company.wilaya && (
                      <span className="admin-quote-card__meta"> · {q.company.wilaya}</span>
                    )}
                    {q.company.phone && (
                      <span className="admin-quote-card__meta"> · {q.company.phone}</span>
                    )}
                  </div>
                  <span className="admin-quote-card__date">
                    {new Date(q.createdAt).toLocaleDateString("fr-DZ")}
                  </span>
                </div>

                <ul className="admin-quote-card__items">
                  {q.items.map((item) => (
                    <li key={item.id}>
                      <strong>{item.formation.title}</strong>
                      {" — "}{item.participants} participant{item.participants > 1 ? "s" : ""}
                      {item.preferredDate && ` — Souhaité le ${item.preferredDate}`}
                    </li>
                  ))}
                </ul>

                {q.message && <p className="admin-quote-card__message">&ldquo;{q.message}&rdquo;</p>}

                <div className="admin-actions">
                  <button className="admin-btn admin-btn--confirm" onClick={() => updateStatus(q.id, "SENT")}>
                    ✉ Envoyer le devis
                  </button>
                  <button className="admin-btn admin-btn--cancel" onClick={() => updateStatus(q.id, "REJECTED")}>
                    ✕ Refuser
                  </button>
                </div>
                <p className="admin-quote-card__hint">
                  Une fois envoyé, l&apos;entreprise accepte ou refuse le devis depuis son propre espace.
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section className="admin-section">
          <h2 className="admin-section__title">Historique devis</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Entreprise</th><th>Formations</th><th>Date</th><th>Statut</th></tr>
              </thead>
              <tbody>
                {others.map((q) => (
                  <tr key={q.id}>
                    <td>{q.company.raisonSociale}</td>
                    <td>{q.items.map((i) => i.formation.title).join(", ")}</td>
                    <td>{new Date(q.createdAt).toLocaleDateString("fr-DZ")}</td>
                    <td>
                      <span className={`admin-badge admin-badge--${q.status.toLowerCase()}`}>
                        {STATUS_LABELS[q.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {!loading && quotes.length === 0 && (
        <p className="admin-table__empty">Aucun devis reçu pour le moment.</p>
      )}
    </div>
  );
}
