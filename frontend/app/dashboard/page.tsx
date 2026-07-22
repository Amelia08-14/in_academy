"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import DocumentUploader from "@/app/components/DocumentUploader";
import { useAuth } from "@/app/hooks/useAuth";

interface LearnerProfile { firstName: string; lastName: string; phone: string | null; jobTitle: string | null }
interface Formation { title: string }
interface Session { formation: Formation }
interface Enrollment {
  id: string;
  type: "INDIVIDUAL" | "GROUP" | "COMPANY";
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  createdAt: string;
  confirmedAt: string | null;
  session: Session | null;
  formation: Formation | null;
}
interface Me {
  email: string;
  role: string;
  createdAt: string;
  learnerProfile: LearnerProfile | null;
}
interface Partner {
  id: string;
  name: string;
  description: string | null;
  discountRate: string | null;
  contact: string | null;
}
interface Doc {
  id: string;
  type: "RECU" | "DOSSIER_ADMIN";
  fileUrl: string;
  originalName: string | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: string }> = {
  PENDING:   { label: "En attente",  cls: "pending",   icon: "⏳" },
  CONFIRMED: { label: "Confirmée",   cls: "confirmed", icon: "✓" },
  CANCELLED: { label: "Annulée",     cls: "cancelled", icon: "✕" },
  COMPLETED: { label: "Terminée",    cls: "completed", icon: "★" },
};

const TYPE_LABELS: Record<string, string> = {
  INDIVIDUAL: "Individuel",
  GROUP:      "Groupe",
  COMPANY:    "Entreprise",
};

export default function DashboardPage() {
  const router = useRouter();
  const { ready, token, role, logout: clearAuth } = useAuth();
  const [me, setMe] = useState<Me | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDocuments = () => {
    const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
    const t = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!t) return;
    fetch(`${BASE}/documents`, { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((d) => setDocuments(Array.isArray(d) ? d : []))
      .catch(() => {});
  };

  useEffect(() => {
    if (!ready) return;

    if (!token) { router.replace("/connexion"); return; }
    if (role === "COMPANY_ADMIN") { router.replace("/espace-entreprise"); return; }

    const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    Promise.all([
      fetch(`${BASE}/auth/me`, { headers }).then((r) => r.json()),
      fetch(`${BASE}/enrollments`, { headers }).then((r) => r.json()),
      fetch(`${BASE}/partners`).then((r) => r.json()).catch(() => []),
      fetch(`${BASE}/documents`, { headers }).then((r) => r.json()).catch(() => []),
    ])
      .then(([meData, enrData, partnersData, docsData]) => {
        setMe(meData);
        setEnrollments(Array.isArray(enrData) ? enrData : []);
        setPartners(Array.isArray(partnersData) ? partnersData : []);
        setDocuments(Array.isArray(docsData) ? docsData : []);
      })
      .catch(() => setError("Erreur de chargement."))
      .finally(() => setLoading(false));
  }, [ready, token, role, router]);

  const logout = () => {
    clearAuth();
    router.push("/connexion");
  };

  const active    = enrollments.filter((e) => e.status === "CONFIRMED" || e.status === "PENDING");
  const history   = enrollments.filter((e) => e.status === "CANCELLED" || e.status === "COMPLETED");
  const pending   = enrollments.filter((e) => e.status === "PENDING");
  const confirmed = enrollments.filter((e) => e.status === "CONFIRMED");

  const getTitle = (e: Enrollment) =>
    e.session?.formation?.title ?? e.formation?.title ?? "Formation non précisée";

  if (loading) return (
    <>
      <Header />
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--text-muted)" }}>Chargement…</p>
      </div>
    </>
  );

  const fullName = me?.learnerProfile
    ? `${me.learnerProfile.firstName} ${me.learnerProfile.lastName}`
    : me?.email ?? "";

  return (
    <>
      <Header />

      <div className="dashboard-page">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <div className="dashboard-profile">
            <div className="dashboard-avatar">{fullName.charAt(0).toUpperCase()}</div>
            <h2 className="dashboard-name">{fullName}</h2>
            <p className="dashboard-email">{me?.email}</p>
            {me?.learnerProfile?.jobTitle && (
              <span className="dashboard-job">{me.learnerProfile.jobTitle}</span>
            )}
          </div>

          <nav className="dashboard-nav">
            <span className="dashboard-nav__item dashboard-nav__item--active">
              <span>◉</span> Mes formations
            </span>
            <Link href="/branches" className="dashboard-nav__item">
              <span>✦</span> Catalogue
            </Link>
            <Link href="/inscription" className="dashboard-nav__item">
              <span>+</span> Nouvelle inscription
            </Link>
          </nav>

          <button className="dashboard-logout" onClick={logout}>
            Déconnexion
          </button>
        </aside>

        {/* Main content */}
        <main className="dashboard-main">
          {error && <div className="auth-error">{error}</div>}

          {/* KPIs */}
          <div className="dashboard-kpis">
            <div className="dashboard-kpi">
              <span className="dashboard-kpi__num">{enrollments.length}</span>
              <span className="dashboard-kpi__lbl">Inscriptions total</span>
            </div>
            <div className="dashboard-kpi dashboard-kpi--gold">
              <span className="dashboard-kpi__num">{confirmed.length}</span>
              <span className="dashboard-kpi__lbl">Confirmées</span>
            </div>
            <div className="dashboard-kpi dashboard-kpi--orange">
              <span className="dashboard-kpi__num">{pending.length}</span>
              <span className="dashboard-kpi__lbl">En attente</span>
            </div>
            <div className="dashboard-kpi dashboard-kpi--muted">
              <span className="dashboard-kpi__num">{history.length}</span>
              <span className="dashboard-kpi__lbl">Historique</span>
            </div>
          </div>

          {/* Formations actives */}
          <section className="dashboard-section">
            <h2 className="dashboard-section__title">Mes formations en cours</h2>
            {active.length === 0 ? (
              <div className="dashboard-empty">
                <p>Aucune formation active.</p>
                <Link href="/branches" className="btn btn--primary" style={{ fontSize: 13, marginTop: 16 }}>
                  Découvrir les formations
                </Link>
              </div>
            ) : (
              <div className="dashboard-cards">
                {active.map((e) => {
                  const cfg = STATUS_CONFIG[e.status];
                  return (
                    <div key={e.id} className={`dashboard-card dashboard-card--${cfg.cls}`}>
                      <div className="dashboard-card__top">
                        <span className={`dashboard-status dashboard-status--${cfg.cls}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                        <span className="dashboard-card__type">{TYPE_LABELS[e.type]}</span>
                      </div>
                      <h3 className="dashboard-card__title">{getTitle(e)}</h3>
                      <p className="dashboard-card__date">
                        Inscrit le {new Date(e.createdAt).toLocaleDateString("fr-DZ", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                      {e.status === "PENDING" && (
                        <p className="dashboard-card__note">
                          Votre inscription est en cours de validation par notre équipe.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Historique */}
          {history.length > 0 && (
            <section className="dashboard-section">
              <h2 className="dashboard-section__title">Historique</h2>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr><th>Formation</th><th>Type</th><th>Date</th><th>Statut</th></tr>
                  </thead>
                  <tbody>
                    {history.map((e) => {
                      const cfg = STATUS_CONFIG[e.status];
                      return (
                        <tr key={e.id}>
                          <td style={{ fontWeight: 600, color: "var(--navy)" }}>{getTitle(e)}</td>
                          <td><span className="admin-badge admin-badge--role">{TYPE_LABELS[e.type]}</span></td>
                          <td style={{ fontSize: 13, color: "var(--text-muted)" }}>{new Date(e.createdAt).toLocaleDateString("fr-DZ")}</td>
                          <td><span className={`admin-badge admin-badge--${cfg.cls}`}>{cfg.label}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Mes documents — reçu de paiement & dossier administratif (tâches 4 & 5) */}
          <section className="dashboard-section">
            <h2 className="dashboard-section__title">Mes documents</h2>
            <div className="dashboard-docs-uploaders">
              <DocumentUploader
                type="RECU"
                label="Reçu de paiement"
                hint="Déposez votre reçu (image ou PDF) — l'administration en est notifiée."
                onDone={loadDocuments}
              />
              <DocumentUploader
                type="DOSSIER_ADMIN"
                label="Dossier administratif"
                hint="Pièces d'identité, justificatifs… (image ou PDF)."
                onDone={loadDocuments}
              />
            </div>

            {documents.length > 0 && (
              <div className="dashboard-docs-list">
                {documents.map((d) => (
                  <div className="dashboard-doc" key={d.id}>
                    <span className={`dashboard-doc__badge dashboard-doc__badge--${d.type === "RECU" ? "recu" : "dossier"}`}>
                      {d.type === "RECU" ? "Reçu" : "Dossier"}
                    </span>
                    <a
                      href={`/api/files/${encodeURIComponent(d.fileUrl.replace(/^\/?uploads\//, ""))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="dashboard-doc__name"
                    >
                      {d.originalName ?? "Document"}
                    </a>
                    <span className="dashboard-doc__date">
                      {new Date(d.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Avantages partenaires (tâche 3) */}
          {partners.length > 0 && (
            <section className="dashboard-section">
              <h2 className="dashboard-section__title">Vos avantages partenaires</h2>
              <div className="dashboard-perks">
                {partners.map((p) => (
                  <div className="dashboard-perk" key={p.id}>
                    <div className="dashboard-perk__head">
                      <span className="dashboard-perk__name">{p.name}</span>
                      {p.discountRate && <span className="dashboard-perk__badge">{p.discountRate}</span>}
                    </div>
                    {p.description && <p className="dashboard-perk__desc">{p.description}</p>}
                    {p.contact && <p className="dashboard-perk__contact">📍 {p.contact}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>

      <Footer />
    </>
  );
}
