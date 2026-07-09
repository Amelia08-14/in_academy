"use client";

import { useEffect, useState } from "react";
import { adminApi as api } from "@/lib/adminApi";

interface Stats {
  totalUsers: number;
  totalFormations: number;
  pendingEnrollments: number;
  pendingQuotes: number;
  totalCompanies: number;
  totalTrainers: number;
}

const QUICK_LINKS = [
  { icon: "✎", label: "Inscriptions",   sub: "Valider les demandes",   href: "/admin/inscriptions",  color: "#e67e22" },
  { icon: "◈", label: "Devis B2B",      sub: "Traiter les demandes",   href: "/admin/devis",          color: "var(--gold)" },
  { icon: "◉", label: "Formations",     sub: "Catalogue complet",      href: "/admin/formations",     color: "var(--navy)" },
  { icon: "★", label: "Formateurs",     sub: "Gérer l'équipe",         href: "/admin/formateurs",     color: "var(--teal-dark)" },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<Stats>("/admin/stats")
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const kpis = stats
    ? [
        { label: "Apprenants inscrits",     value: stats.totalUsers,         color: "var(--navy)",      icon: "◎", href: "/admin/utilisateurs" },
        { label: "Formations actives",      value: stats.totalFormations,    color: "var(--gold)",      icon: "◉", href: "/admin/formations" },
        { label: "Formateurs actifs",       value: stats.totalTrainers,      color: "var(--teal-dark)", icon: "★", href: "/admin/formateurs" },
        { label: "Inscriptions en attente", value: stats.pendingEnrollments, color: "#e67e22",          icon: "✎", href: "/admin/inscriptions" },
        { label: "Devis B2B en attente",    value: stats.pendingQuotes,      color: "var(--gold-dark)", icon: "◈", href: "/admin/devis" },
        { label: "Entreprises partenaires", value: stats.totalCompanies,     color: "var(--teal)",      icon: "▤", href: "/admin/utilisateurs" },
      ]
    : [];

  const today = new Date().toLocaleDateString("fr-DZ", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-dashboard-header">
        <div>
          <p className="admin-dashboard-date">{today}</p>
          <h1 className="admin-page__title">Vue d&apos;ensemble</h1>
        </div>
        {stats && stats.pendingEnrollments + stats.pendingQuotes > 0 && (
          <div className="admin-dashboard-alert">
            <span className="admin-dashboard-alert__dot" />
            {stats.pendingEnrollments + stats.pendingQuotes} action{stats.pendingEnrollments + stats.pendingQuotes > 1 ? "s" : ""} en attente
          </div>
        )}
      </div>

      {loading && <p className="admin-loading">Chargement…</p>}
      {error && <div className="auth-error">{error}</div>}

      {/* KPIs */}
      {stats && (
        <div className="admin-kpis">
          {kpis.map((kpi) => (
            <a key={kpi.label} href={kpi.href} className="admin-kpi" style={{ borderTopColor: kpi.color }}>
              <span className="admin-kpi__icon" style={{ color: kpi.color, background: `color-mix(in srgb, ${kpi.color} 12%, transparent)` }}>
                {kpi.icon}
              </span>
              <span className="admin-kpi__value">{kpi.value}</span>
              <span className="admin-kpi__label">{kpi.label}</span>
            </a>
          ))}
        </div>
      )}

      {/* Quick access */}
      <section className="admin-section">
        <div className="admin-section__header">
          <h2 className="admin-section__title">Accès rapides</h2>
        </div>
        <div className="admin-quick-links">
          {QUICK_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="admin-quick-link">
              <span className="admin-quick-link__icon" style={{ color: l.color, background: `color-mix(in srgb, ${l.color} 10%, transparent)` }}>
                {l.icon}
              </span>
              <span className="admin-quick-link__text">
                <span className="admin-quick-link__label">{l.label}</span>
                <span className="admin-quick-link__sub">{l.sub}</span>
              </span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
