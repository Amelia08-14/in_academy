"use client";

import { Fragment, useEffect, useState } from "react";
import { adminApi as api } from "@/lib/adminApi";

interface LearnerProfile { firstName: string; lastName: string; phone: string | null; jobTitle: string | null }
interface Company { raisonSociale: string; wilaya: string | null; commune: string | null; phone: string | null }
interface User { email: string; learnerProfile: LearnerProfile | null }
interface Formation { title: string; description: string | null; duration: string | null; price: number | null }
interface Category { name: string }
interface Session {
  title: string;
  description: string | null;
  duration: string | null;
  location: string | null;
  startDate: string;
  category: Category;
  formation: Formation | null;
}
interface Employee { id: string; firstName: string; lastName: string; email: string | null }
interface Enrollment {
  id: string;
  type: "INDIVIDUAL" | "GROUP" | "COMPANY";
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  createdAt: string;
  user: User;
  session: Session | null;
  formation: Formation | null;
  company: Company | null;
  employees: Employee[];
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  CANCELLED: "Annulée",
  COMPLETED: "Terminée",
};

const TYPE_LABELS: Record<string, string> = {
  INDIVIDUAL: "Individuel",
  GROUP: "Groupe",
  COMPANY: "Entreprise",
};

export default function AdminInscriptionsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api.get<Enrollment[]>("/admin/enrollments")
      .then(setEnrollments)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const confirm = async (id: string) => {
    await api.patch(`/admin/enrollments/${id}/confirm`);
    load();
  };

  const cancel = async (id: string) => {
    await api.patch(`/admin/enrollments/${id}/cancel`);
    load();
  };

  const remove = async (id: string) => {
    if (!window.confirm("Supprimer définitivement cette inscription ?")) return;
    await api.delete(`/admin/enrollments/${id}`);
    load();
  };

  const getFormationTitle = (e: Enrollment) =>
    e.session?.title ?? e.session?.formation?.title ?? e.formation?.title ?? "—";

  const pending = enrollments.filter((e) => e.status === "PENDING");
  const others  = enrollments.filter((e) => e.status !== "PENDING");

  const UserCell = ({ e }: { e: Enrollment }) => {
    const name = e.company
      ? e.company.raisonSociale
      : e.user.learnerProfile
        ? `${e.user.learnerProfile.firstName} ${e.user.learnerProfile.lastName}`
        : e.user.email;
    return (
      <div className="admin-table__user">
        <span className="admin-table__avatar">{name.charAt(0).toUpperCase()}</span>
        <div>
          <span className="admin-table__name">{name}</span>
          <span className="admin-table__email">{e.user.email}</span>
        </div>
      </div>
    );
  };

  const DetailsRow = ({ e }: { e: Enrollment }) => (
    <tr className="admin-details-row">
      <td colSpan={6}>
        <div className="admin-details">
          {e.company ? (
            <>
              <div className="admin-details__block">
                <span className="admin-details__label">Entreprise</span>
                <span className="admin-details__value">{e.company.raisonSociale}</span>
                <span className="admin-details__meta">
                  {[e.company.commune, e.company.wilaya].filter(Boolean).join(", ") || "—"}
                  {e.company.phone ? ` · ${e.company.phone}` : ""}
                </span>
              </div>
              <div className="admin-details__block">
                <span className="admin-details__label">Employés inscrits ({e.employees.length})</span>
                {e.employees.length === 0 ? (
                  <span className="admin-details__meta">Aucun employé ajouté pour l&apos;instant.</span>
                ) : (
                  <ul className="admin-details__list">
                    {e.employees.map((emp) => (
                      <li key={emp.id}>
                        {emp.firstName} {emp.lastName}{emp.email ? ` — ${emp.email}` : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <div className="admin-details__block">
              <span className="admin-details__label">Apprenant</span>
              <span className="admin-details__value">
                {e.user.learnerProfile ? `${e.user.learnerProfile.firstName} ${e.user.learnerProfile.lastName}` : e.user.email}
              </span>
              <span className="admin-details__meta">{e.user.email}</span>
              {e.user.learnerProfile?.phone && (
                <span className="admin-details__meta">Téléphone : {e.user.learnerProfile.phone}</span>
              )}
              {e.user.learnerProfile?.jobTitle && (
                <span className="admin-details__meta">Statut : {e.user.learnerProfile.jobTitle}</span>
              )}
            </div>
          )}
          {e.session && (
            <div className="admin-details__block">
              <span className="admin-details__label">Session</span>
              <span className="admin-details__value">{e.session.title}</span>
              <span className="admin-details__meta">Branche : {e.session.category.name}</span>
              <span className="admin-details__meta">
                {new Date(e.session.startDate).toLocaleDateString("fr-DZ")}
                {e.session.duration ? ` · ${e.session.duration}` : ""}
                {e.session.location ? ` · ${e.session.location}` : ""}
              </span>
              {e.session.description && (
                <span className="admin-details__meta">{e.session.description}</span>
              )}
            </div>
          )}
          {e.formation && !e.session && (
            <div className="admin-details__block">
              <span className="admin-details__label">Formation</span>
              <span className="admin-details__value">{e.formation.title}</span>
              <span className="admin-details__meta">
                {e.formation.duration ?? "Durée non précisée"}
                {e.formation.price != null ? ` · ${e.formation.price.toLocaleString("fr-DZ")} DA` : ""}
              </span>
              {e.formation.description && (
                <span className="admin-details__meta">{e.formation.description}</span>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  );

  const renderRows = (list: Enrollment[], withActions: boolean) =>
    list.map((e) => (
      <Fragment key={e.id}>
        <tr>
          <td><UserCell e={e} /></td>
          <td>{getFormationTitle(e)}</td>
          <td>
            <span className="admin-badge admin-badge--role">{TYPE_LABELS[e.type] ?? e.type}</span>
          </td>
          <td>{new Date(e.createdAt).toLocaleDateString("fr-DZ")}</td>
          {withActions ? (
            <td>
              <div className="admin-actions">
                <button className="admin-btn admin-btn--confirm" onClick={() => confirm(e.id)}>✓ Confirmer</button>
                <button className="admin-btn admin-btn--cancel" onClick={() => cancel(e.id)}>✕ Refuser</button>
                <button className="admin-btn" onClick={() => setExpanded(expanded === e.id ? null : e.id)}>
                  {expanded === e.id ? "Masquer" : "Détails"}
                </button>
                <button className="admin-btn admin-btn--cancel" onClick={() => remove(e.id)}>Supprimer</button>
              </div>
            </td>
          ) : (
            <td style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className={`admin-badge admin-badge--${e.status.toLowerCase()}`}>
                {STATUS_LABELS[e.status]}
              </span>
              <button className="admin-btn" onClick={() => setExpanded(expanded === e.id ? null : e.id)}>
                {expanded === e.id ? "Masquer" : "Détails"}
              </button>
              <button className="admin-btn admin-btn--cancel" onClick={() => remove(e.id)}>Supprimer</button>
            </td>
          )}
        </tr>
        {expanded === e.id && <DetailsRow e={e} />}
      </Fragment>
    ));

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title">Inscriptions</h1>
        {pending.length > 0 && (
          <span className="admin-kpi admin-kpi--inline">{pending.length} en attente</span>
        )}
      </div>

      {loading && <p className="admin-loading">Chargement…</p>}
      {error && <div className="auth-error">{error}</div>}

      {pending.length > 0 && (
        <section className="admin-section">
          <div className="admin-section__header">
            <h2 className="admin-section__title">En attente de validation</h2>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Apprenant</th><th>Formation</th><th>Type</th><th>Date</th><th>Actions</th></tr>
              </thead>
              <tbody>{renderRows(pending, true)}</tbody>
            </table>
          </div>
        </section>
      )}

      <section className="admin-section">
        <div className="admin-section__header">
          <h2 className="admin-section__title">Historique</h2>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Apprenant</th><th>Formation</th><th>Type</th><th>Date</th><th>Statut</th></tr>
            </thead>
            <tbody>
              {others.length === 0 && !loading && (
                <tr><td colSpan={5} className="admin-table__empty">Aucune inscription traitée</td></tr>
              )}
              {renderRows(others, false)}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
