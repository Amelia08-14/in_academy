"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { adminApi as api } from "@/lib/adminApi";

interface Stats { totalUsers: number; totalFormations: number; pendingEnrollments: number; pendingQuotes: number; totalCompanies: number; totalTrainers: number }
type IconName = "users" | "book" | "trainer" | "company" | "check" | "quote" | "arrow" | "plus";

const paths: Record<IconName, ReactNode> = {
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22V5.5Z"/></>,
  trainer: <><circle cx="12" cy="7" r="4"/><path d="M5 21a7 7 0 0 1 14 0M19 4v6M16 7h6"/></>,
  company: <><path d="M4 21V7h10v14M14 11h6v10M8 11h2M8 15h2M8 19h2M17 15h.01M17 19h.01"/></>,
  check: <><path d="M12 3 4.5 6v5.2c0 4.7 3.2 8.2 7.5 9.8 4.3-1.6 7.5-5.1 7.5-9.8V6L12 3Z"/><path d="m9 12 2 2 4-4"/></>,
  quote: <><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></>,
  arrow: <path d="M5 12h14M14 7l5 5-5 5"/>, plus: <path d="M12 5v14M5 12h14"/>,
};
function Icon({ name }: { name: IconName }) { return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg> }

const QUICK_LINKS: Array<{ icon: IconName; label: string; sub: string; href: string }> = [
  { icon: "plus", label: "Nouvelle formation", sub: "Enrichir le catalogue", href: "/admin/formations" },
  { icon: "trainer", label: "Ajouter un formateur", sub: "Développer l’équipe", href: "/admin/formateurs" },
  { icon: "book", label: "Planifier une session", sub: "Ouvrir de nouvelles dates", href: "/admin/sessions" },
  { icon: "users", label: "Gérer les utilisateurs", sub: "Membres et entreprises", href: "/admin/utilisateurs" },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null), [loading, setLoading] = useState(true), [error, setError] = useState("");
  useEffect(() => { api.get<Stats>("/admin/stats").then(setStats).catch((e) => setError(e instanceof Error ? e.message : "Impossible de charger les statistiques.")).finally(() => setLoading(false)) }, []);
  const today = new Date().toLocaleDateString("fr-DZ", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const pendingTotal = stats ? stats.pendingEnrollments + stats.pendingQuotes : 0;
  const max = stats ? Math.max(stats.totalUsers, stats.totalTrainers, stats.totalCompanies, 1) : 1;
  const kpis = stats ? [
    { label: "Apprenants", helper: "Comptes inscrits", value: stats.totalUsers, icon: "users" as const, href: "/admin/utilisateurs", tone: "navy" },
    { label: "Formations", helper: "Catalogue actif", value: stats.totalFormations, icon: "book" as const, href: "/admin/formations", tone: "gold" },
    { label: "Formateurs", helper: "Équipe pédagogique", value: stats.totalTrainers, icon: "trainer" as const, href: "/admin/formateurs", tone: "teal" },
    { label: "Entreprises", helper: "Comptes partenaires", value: stats.totalCompanies, icon: "company" as const, href: "/admin/utilisateurs", tone: "blue" },
  ] : [];

  return <div className="admin-page admin-overview">
    <section className="admin-overview-hero"><div><p className="admin-dashboard-date">{today}</p><h1>Bonjour, bienvenue sur Academy</h1><p>Pilotez votre catalogue, votre communauté et les demandes depuis un seul espace.</p></div><Link href="/admin/formations" className="admin-overview-hero__action"><Icon name="plus" /> Nouvelle formation</Link></section>
    {loading && <div className="admin-overview-loading"><span /> Chargement de votre espace…</div>}{error && <div className="auth-error">{error}</div>}
    {stats && <>
      <section className="admin-overview-kpis" aria-label="Indicateurs clés">{kpis.map(k => <Link key={k.label} href={k.href} className={`admin-overview-kpi admin-overview-kpi--${k.tone}`}><span className="admin-overview-kpi__icon"><Icon name={k.icon}/></span><span className="admin-overview-kpi__meta"><strong>{k.value}</strong><span>{k.label}</span><small>{k.helper}</small></span><span className="admin-overview-kpi__arrow"><Icon name="arrow"/></span></Link>)}</section>
      <div className="admin-overview-grid">
        <section className="admin-overview-panel admin-overview-panel--queue"><div className="admin-overview-panel__head"><div><span className="admin-overview-eyebrow">À traiter</span><h2>File de travail</h2></div><span className={`admin-overview-count${pendingTotal === 0 ? " admin-overview-count--clear" : ""}`}>{pendingTotal}</span></div><div className="admin-overview-tasks">
          <Link href="/admin/inscriptions" className="admin-overview-task"><span className="admin-overview-task__icon"><Icon name="check"/></span><span><strong>Inscriptions à valider</strong><small>Demandes des apprenants</small></span><b>{stats.pendingEnrollments}</b><i><Icon name="arrow"/></i></Link>
          <Link href="/admin/devis" className="admin-overview-task"><span className="admin-overview-task__icon admin-overview-task__icon--gold"><Icon name="quote"/></span><span><strong>Devis B2B</strong><small>Demandes des entreprises</small></span><b>{stats.pendingQuotes}</b><i><Icon name="arrow"/></i></Link>
        </div>{pendingTotal === 0 && <div className="admin-overview-clear"><span>✓</span> Tout est à jour, aucune action urgente.</div>}</section>
        <section className="admin-overview-panel"><div className="admin-overview-panel__head"><div><span className="admin-overview-eyebrow">Communauté</span><h2>Écosystème Academy</h2></div></div><div className="admin-overview-bars">{[["Apprenants",stats.totalUsers,"navy"],["Formateurs",stats.totalTrainers,"teal"],["Entreprises",stats.totalCompanies,"gold"]].map(([label,value,tone]) => <div className="admin-overview-bar" key={String(label)}><div><span>{label}</span><strong>{value}</strong></div><span className="admin-overview-bar__track"><i className={`admin-overview-bar__fill admin-overview-bar__fill--${tone}`} style={{width:`${Math.max(Number(value)/max*100,Number(value)?8:0)}%`}}/></span></div>)}</div></section>
      </div>
      <section className="admin-overview-shortcuts"><div className="admin-overview-section-head"><div><span className="admin-overview-eyebrow">Raccourcis</span><h2>Actions fréquentes</h2></div></div><div className="admin-overview-shortcuts__grid">{QUICK_LINKS.map(l => <Link key={l.label} href={l.href} className="admin-overview-shortcut"><span><Icon name={l.icon}/></span><div><strong>{l.label}</strong><small>{l.sub}</small></div><i><Icon name="arrow"/></i></Link>)}</div></section>
    </>}
  </div>;
}
