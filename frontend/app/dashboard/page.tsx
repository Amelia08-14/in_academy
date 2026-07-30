"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import DocumentUploader from "@/app/components/DocumentUploader";
import { useAuth } from "@/app/hooks/useAuth";
import { fileUrl } from "@/lib/fileUrl";
import { api } from "@/lib/api";

interface LearnerProfile { firstName: string; lastName: string; phone: string | null; jobTitle: string | null; birthDate: string | null; wilaya: string | null }
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
interface Material { id: string; title: string; fileUrl: string; createdAt: string }
interface SessionMaterials { sessionId: string; sessionTitle: string; startDate: string; materials: Material[] }

type Tab = "formations" | "profil";

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

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, token, role, logout: clearAuth } = useAuth();
  const [tab, setTab] = useState<Tab>(searchParams.get("tab") === "profil" ? "profil" : "formations");
  const [me, setMe] = useState<Me | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [sessionMaterials, setSessionMaterials] = useState<SessionMaterials[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ firstName: "", lastName: "", phone: "", jobTitle: "", birthDate: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);

  const goToTab = (t: Tab) => {
    setTab(t);
    router.replace(`/dashboard?tab=${t}`, { scroll: false });
  };

  const removeDocument = async (id: string) => {
    if (!window.confirm("Retirer définitivement ce document ?")) return;
    try {
      await api.delete(`/documents/${id}`);
      loadDocuments();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur lors de la suppression");
    }
  };

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
      fetch(`${BASE}/enrollments/materials`, { headers }).then((r) => r.json()).catch(() => []),
    ])
      .then(([meData, enrData, partnersData, docsData, materialsData]) => {
        setMe(meData);
        setEnrollments(Array.isArray(enrData) ? enrData : []);
        setPartners(Array.isArray(partnersData) ? partnersData : []);
        setDocuments(Array.isArray(docsData) ? docsData : []);
        setSessionMaterials(Array.isArray(materialsData) ? materialsData : []);
      })
      .catch(() => setError("Erreur de chargement."))
      .finally(() => setLoading(false));
  }, [ready, token, role, router]);

  const logout = () => {
    clearAuth();
    router.push("/connexion");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordError("");
    setPasswordSuccess(false);
    try {
      await api.patch("/auth/password", { currentPassword, newPassword });
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setPasswordSaving(false);
    }
  };

  const loadMe = () => {
    const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    return fetch(`${BASE}/auth/me`, { headers }).then((r) => r.json()).then(setMe);
  };

  const openEditProfile = () => {
    setProfileForm({
      firstName: me?.learnerProfile?.firstName ?? "",
      lastName: me?.learnerProfile?.lastName ?? "",
      phone: me?.learnerProfile?.phone ?? "",
      jobTitle: me?.learnerProfile?.jobTitle ?? "",
      birthDate: me?.learnerProfile?.birthDate ? me.learnerProfile.birthDate.slice(0, 10) : "",
    });
    setProfileError("");
    setProfileSuccess(false);
    setEditingProfile(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError("");
    try {
      await api.patch("/auth/profile", {
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        phone: profileForm.phone || null,
        jobTitle: profileForm.jobTitle || null,
        birthDate: profileForm.birthDate || null,
      });
      await loadMe();
      setProfileSuccess(true);
      setEditingProfile(false);
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setProfileSaving(false);
    }
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
            <button
              type="button"
              className={`dashboard-nav__item${tab === "formations" ? " dashboard-nav__item--active" : ""}`}
              onClick={() => goToTab("formations")}
            >
              <span>◉</span> Mes formations
            </button>
            <button
              type="button"
              className={`dashboard-nav__item${tab === "profil" ? " dashboard-nav__item--active" : ""}`}
              onClick={() => goToTab("profil")}
            >
              <span>⚬</span> Mon profil
            </button>
            <Link href="/formations/particulier" className="dashboard-nav__item">
              <span>✦</span> Sessions disponibles
            </Link>
            <Link href="/contact" className="dashboard-nav__item">
              <span>+</span> Demander une formation
            </Link>
          </nav>

          <button className="dashboard-logout" onClick={logout}>
            Déconnexion
          </button>
        </aside>

        {/* Main content */}
        <main className="dashboard-main">
          {error && <div className="auth-error">{error}</div>}

          {tab === "formations" ? (
            <>
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
                    <Link href="/formations/particulier" className="btn btn--primary" style={{ fontSize: 13, marginTop: 16 }}>
                      Découvrir les sessions
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

              {/* Supports de cours des sessions confirmées */}
              {sessionMaterials.length > 0 && (
                <section className="dashboard-section">
                  <h2 className="dashboard-section__title">Supports de cours</h2>
                  <div className="dashboard-materials">
                    {sessionMaterials.map((sm) => (
                      <div className="dashboard-materials__group" key={sm.sessionId}>
                        <h3 className="dashboard-materials__session">{sm.sessionTitle}</h3>
                        {sm.materials.length === 0 ? (
                          <p className="dashboard-materials__empty">Aucun support déposé pour l&apos;instant.</p>
                        ) : (
                          <ul className="dashboard-materials__list">
                            {sm.materials.map((m) => (
                              <li key={m.id} className="dashboard-materials__item">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                </svg>
                                <a href={fileUrl(m.fileUrl)} target="_blank" rel="noopener noreferrer">
                                  {m.title}
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            <>
              {/* Mon profil (tâche 2 — vérification des infos, dont l'anniversaire) */}
              <section className="dashboard-section">
                <div className="dashboard-section__head">
                  <h2 className="dashboard-section__title">Mon profil</h2>
                  {!editingProfile && (
                    <button type="button" className="admin-btn" onClick={openEditProfile}>
                      Modifier mes informations
                    </button>
                  )}
                </div>

                {profileSuccess && !editingProfile && (
                  <div className="auth-success" style={{ marginBottom: 16 }}>Profil mis à jour avec succès.</div>
                )}

                {editingProfile ? (
                  <form onSubmit={handleSaveProfile} className="auth-form" style={{ maxWidth: 520 }}>
                    {profileError && <div className="auth-error">{profileError}</div>}
                    <div className="auth-row">
                      <div className="auth-field">
                        <label className="auth-label">Prénom</label>
                        <input
                          type="text" className="auth-input" required minLength={2}
                          value={profileForm.firstName}
                          onChange={(e) => setProfileForm((v) => ({ ...v, firstName: e.target.value }))}
                        />
                      </div>
                      <div className="auth-field">
                        <label className="auth-label">Nom</label>
                        <input
                          type="text" className="auth-input" required minLength={2}
                          value={profileForm.lastName}
                          onChange={(e) => setProfileForm((v) => ({ ...v, lastName: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="auth-row">
                      <div className="auth-field">
                        <label className="auth-label">Téléphone</label>
                        <input
                          type="tel" className="auth-input"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm((v) => ({ ...v, phone: e.target.value }))}
                        />
                      </div>
                      <div className="auth-field">
                        <label className="auth-label">Fonction</label>
                        <input
                          type="text" className="auth-input"
                          value={profileForm.jobTitle}
                          onChange={(e) => setProfileForm((v) => ({ ...v, jobTitle: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="auth-field">
                      <label className="auth-label">Date d&apos;anniversaire</label>
                      <input
                        type="date" className="auth-input"
                        value={profileForm.birthDate}
                        onChange={(e) => setProfileForm((v) => ({ ...v, birthDate: e.target.value }))}
                      />
                    </div>
                    <div className="auth-form-actions">
                      <button type="button" className="btn btn--outline" onClick={() => setEditingProfile(false)}>
                        Annuler
                      </button>
                      <button type="submit" className="btn btn--primary" disabled={profileSaving}>
                        {profileSaving ? "Enregistrement…" : "Enregistrer"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="dashboard-profile-grid">
                    <div className="dashboard-profile-item"><span>Nom complet</span><strong>{fullName}</strong></div>
                    <div className="dashboard-profile-item"><span>Email</span><strong>{me?.email}</strong></div>
                    <div className="dashboard-profile-item"><span>Téléphone</span><strong>{me?.learnerProfile?.phone || "—"}</strong></div>
                    <div className="dashboard-profile-item"><span>Fonction</span><strong>{me?.learnerProfile?.jobTitle || "—"}</strong></div>
                    <div className="dashboard-profile-item">
                      <span>Date d&apos;anniversaire</span>
                      <strong>
                        {me?.learnerProfile?.birthDate
                          ? new Date(me.learnerProfile.birthDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                          : "Non renseignée"}
                      </strong>
                    </div>
                    <div className="dashboard-profile-item"><span>Membre depuis</span><strong>{me ? new Date(me.createdAt).toLocaleDateString("fr-FR") : "—"}</strong></div>
                  </div>
                )}
              </section>

              {/* Changer le mot de passe */}
              <section className="dashboard-section">
                <h2 className="dashboard-section__title">Modifier le mot de passe</h2>
                <form onSubmit={handleChangePassword} className="auth-form" style={{ maxWidth: 420 }}>
                  {passwordError && <div className="auth-error">{passwordError}</div>}
                  {passwordSuccess && <div className="auth-success">Mot de passe mis à jour avec succès.</div>}

                  <div className="auth-field">
                    <label className="auth-label">Mot de passe actuel</label>
                    <input
                      type="password" className="auth-input" required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="auth-field">
                    <label className="auth-label">Nouveau mot de passe</label>
                    <input
                      type="password" className="auth-input" required minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="8 caractères minimum"
                    />
                  </div>
                  <div className="auth-form-actions">
                    <button type="submit" className="btn btn--primary" disabled={passwordSaving}>
                      {passwordSaving ? "Enregistrement…" : "Mettre à jour"}
                    </button>
                  </div>
                </form>
              </section>

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
                        <button
                          type="button"
                          className="dashboard-doc__remove"
                          onClick={() => removeDocument(d.id)}
                          aria-label="Retirer ce document"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
                          </svg>
                        </button>
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
            </>
          )}
        </main>
      </div>

      <Footer />
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh" }} />}>
      <DashboardContent />
    </Suspense>
  );
}
