"use client";

import { Fragment, useEffect, useState } from "react";
import { adminApi as api } from "@/lib/adminApi";

interface LearnerProfile { firstName: string; lastName: string; phone: string | null; jobTitle: string | null }
interface Company { raisonSociale: string; wilaya: string | null; commune: string | null; phone: string | null }
interface User { email: string; learnerProfile: LearnerProfile | null }
interface Formation { title: string; description: string | null; duration: string | null; price: number | null }
interface Category { name: string }
interface Session {
  id: string;
  title: string;
  description: string | null;
  duration: string | null;
  location: string | null;
  startDate: string;
  price: number | null;
  maxCapacity: number;
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
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (key: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const load = () => {
    setLoading(true);
    api.get<Enrollment[]>("/admin/enrollments")
      .then((data) => {
        setEnrollments(data);
        // On ouvre automatiquement les sessions qui ont des inscriptions en attente.
        setOpenGroups((prev) => {
          const next = new Set(prev);
          for (const e of data) {
            if (e.session && e.status === "PENDING") next.add(e.session.id);
          }
          return next;
        });
      })
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

  const pending = enrollments.filter((e) => e.status === "PENDING");

  // On regroupe les inscrits par session. Les inscriptions sans session
  // (formations directes / devis entreprise) vont dans un groupe à part.
  const sessionGroups = new Map<string, { session: Session; items: Enrollment[] }>();
  const noSession: Enrollment[] = [];
  for (const e of enrollments) {
    if (e.session) {
      const key = e.session.id;
      if (!sessionGroups.has(key)) sessionGroups.set(key, { session: e.session, items: [] });
      sessionGroups.get(key)!.items.push(e);
    } else {
      noSession.push(e);
    }
  }
  const groups = Array.from(sessionGroups.values()).sort(
    (a, b) => new Date(a.session.startDate).getTime() - new Date(b.session.startDate).getTime()
  );

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
      <td colSpan={4}>
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

  const renderRows = (list: Enrollment[]) =>
    list.map((e) => (
      <Fragment key={e.id}>
        <tr>
          <td><UserCell e={e} /></td>
          <td>
            <span className="admin-badge admin-badge--role">{TYPE_LABELS[e.type] ?? e.type}</span>
          </td>
          <td>{new Date(e.createdAt).toLocaleDateString("fr-DZ")}</td>
          <td>
            <div className="admin-actions">
              {e.status === "PENDING" ? (
                <>
                  <button className="admin-btn admin-btn--confirm" onClick={() => confirm(e.id)}>✓ Confirmer</button>
                  <button className="admin-btn admin-btn--cancel" onClick={() => cancel(e.id)}>✕ Refuser</button>
                </>
              ) : (
                <span className={`admin-badge admin-badge--${e.status.toLowerCase()}`}>
                  {STATUS_LABELS[e.status]}
                </span>
              )}
              <button className="admin-btn" onClick={() => setExpanded(expanded === e.id ? null : e.id)}>
                {expanded === e.id ? "Masquer" : "Détails"}
              </button>
              <button className="admin-btn admin-btn--cancel" onClick={() => remove(e.id)}>Supprimer</button>
            </div>
          </td>
        </tr>
        {expanded === e.id && <DetailsRow e={e} />}
      </Fragment>
    ));

  const GroupTable = ({ list }: { list: Enrollment[] }) => (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr><th>Apprenant</th><th>Type</th><th>Inscrit le</th><th>Statut / Actions</th></tr>
        </thead>
        <tbody>{renderRows(list)}</tbody>
      </table>
    </div>
  );

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

      {!loading && groups.length === 0 && noSession.length === 0 && (
        <p className="admin-table__empty" style={{ padding: 40 }}>Aucune inscription pour le moment.</p>
      )}

      {groups.map(({ session, items }, idx) => {
        const confirmed = items.filter((e) => e.status === "CONFIRMED").length;
        const waiting = items.filter((e) => e.status === "PENDING").length;
        const isOpen = openGroups.has(session.id);
        return (
          <section className="admin-section admin-session-group" key={session.id}>
            <button
              type="button"
              className="admin-session-group__header admin-session-group__header--btn"
              onClick={() => toggleGroup(session.id)}
              aria-expanded={isOpen}
            >
              <div className="admin-session-group__title-wrap">
                <h2 className="admin-section__title">{session.title}</h2>
                <div className="admin-session-group__meta">
                  <span className={`session-date session-date--${idx % 4}`}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                    {new Date(session.startDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                  </span>
                  <span className="admin-session-group__branch">{session.category.name}</span>
                </div>
              </div>
              <div className="admin-session-group__right">
                <span className="admin-kpi admin-kpi--inline">
                  {confirmed}/{session.maxCapacity} inscrit{confirmed > 1 ? "s" : ""}
                  {waiting > 0 ? ` · ${waiting} en attente` : ""}
                </span>
                <span className={`admin-session-group__chevron${isOpen ? " admin-session-group__chevron--open" : ""}`} aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </span>
              </div>
            </button>
            {isOpen && <GroupTable list={items} />}
          </section>
        );
      })}

      {noSession.length > 0 && (
        <section className="admin-section admin-session-group">
          <button
            type="button"
            className="admin-session-group__header admin-session-group__header--btn"
            onClick={() => toggleGroup("__no_session__")}
            aria-expanded={openGroups.has("__no_session__")}
          >
            <div className="admin-session-group__title-wrap">
              <h2 className="admin-section__title">Autres inscriptions (formations directes / entreprises)</h2>
              <div className="admin-session-group__meta">
                <span className="admin-session-group__branch">{noSession.length} inscription{noSession.length > 1 ? "s" : ""}</span>
              </div>
            </div>
            <span className={`admin-session-group__chevron${openGroups.has("__no_session__") ? " admin-session-group__chevron--open" : ""}`} aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </button>
          {openGroups.has("__no_session__") && <GroupTable list={noSession} />}
        </section>
      )}
    </div>
  );
}
