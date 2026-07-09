"use client";

import { useEffect, useState } from "react";
import { adminApi as api } from "@/lib/adminApi";

interface LearnerProfile { firstName: string; lastName: string; phone: string | null }
interface Company { id: string; raisonSociale: string; wilaya: string | null; commune: string | null }
interface CompanyProfile { firstName: string | null; lastName: string | null; company: Company }
interface User {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  learnerProfile: LearnerProfile | null;
  companyAdmin: CompanyProfile | null;
}

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER"];

const ROLE_OPTIONS = [
  { value: "LEARNER",     label: "Apprenant",        desc: "Accès à son espace formation" },
  { value: "MANAGER",     label: "Manager",           desc: "Gestion des inscriptions et devis" },
  { value: "ADMIN",       label: "Administrateur",    desc: "Accès complet sauf gestion des admins" },
  { value: "SUPER_ADMIN", label: "Super Administrateur", desc: "Accès total à toutes les fonctions" },
];

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  MANAGER: "Manager",
  LEARNER: "Apprenant",
  COMPANY_ADMIN: "Entreprise",
};

const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ["Dashboard", "Inscriptions", "Formations", "Formateurs", "Devis B2B", "Utilisateurs", "Paramètres"],
  ADMIN:       ["Dashboard", "Inscriptions", "Formations", "Formateurs", "Devis B2B", "Utilisateurs"],
  MANAGER:     ["Dashboard", "Inscriptions", "Devis B2B"],
  LEARNER:     ["Espace apprenant", "Mes formations", "Mon historique"],
};

const EMPTY_FORM = { email: "", password: "", role: "LEARNER", firstName: "", lastName: "", phone: "" };

export default function AdminUtilisateursPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"learners" | "companies" | "admins">("learners");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = () => {
    api.get<User[]>("/admin/users")
      .then(setUsers)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleActive = async (id: string) => {
    await api.patch(`/admin/users/${id}/toggle-active`);
    load();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      await api.post("/admin/users", {
        email:     form.email,
        password:  form.password,
        role:      form.role,
        firstName: form.firstName || undefined,
        lastName:  form.lastName || undefined,
        phone:     form.phone || undefined,
      });
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const isLearner = form.role === "LEARNER";
  const allLearners = users.filter((u) => u.role === "LEARNER");
  const allCompanies = users.filter((u) => u.role === "COMPANY_ADMIN");
  const allAdmins   = users.filter((u) => ADMIN_ROLES.includes(u.role));

  const q = search.toLowerCase();

  const filteredLearners = allLearners.filter((u) => {
    const name = u.learnerProfile ? `${u.learnerProfile.firstName} ${u.learnerProfile.lastName}`.toLowerCase() : "";
    return u.email.toLowerCase().includes(q) || name.includes(q);
  });
  const filteredCompanies = allCompanies.filter((u) => {
    const name = u.companyAdmin?.company.raisonSociale.toLowerCase() ?? "";
    const contact = u.companyAdmin ? `${u.companyAdmin.firstName ?? ""} ${u.companyAdmin.lastName ?? ""}`.toLowerCase() : "";
    return u.email.toLowerCase().includes(q) || name.includes(q) || contact.includes(q);
  });
  const filteredAdmins = allAdmins.filter((u) => u.email.toLowerCase().includes(q));

  const set = (f: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((v) => ({ ...v, [f]: e.target.value }));

  const StatusCell = ({ u }: { u: User }) => (
    <>
      <td>
        <span className={`admin-badge admin-badge--${u.isActive ? "confirmed" : "cancelled"}`}>
          {u.isActive ? "Actif" : "Inactif"}
        </span>
      </td>
      <td>
        {!ADMIN_ROLES.includes(u.role) && (
          <button
            className={`admin-btn ${u.isActive ? "admin-btn--cancel" : "admin-btn--confirm"}`}
            onClick={() => toggleActive(u.id)}
          >
            {u.isActive ? "Désactiver" : "Activer"}
          </button>
        )}
      </td>
    </>
  );

  const UserRow = ({ u }: { u: User }) => {
    const name = u.learnerProfile
      ? `${u.learnerProfile.firstName} ${u.learnerProfile.lastName}`
      : "—";
    return (
      <tr style={{ opacity: u.isActive ? 1 : 0.5 }}>
        <td>
          <div className="admin-table__user">
            <span className="admin-table__avatar">{u.email.charAt(0).toUpperCase()}</span>
            <div>
              <span className="admin-table__name">{name}</span>
              <span className="admin-table__email">{u.email}</span>
            </div>
          </div>
        </td>
        <td><span className="admin-badge admin-badge--role">{ROLE_LABELS[u.role] ?? u.role}</span></td>
        <td style={{ fontSize: 12 }}>
          {(ROLE_PERMISSIONS[u.role] ?? []).map((p) => (
            <span key={p} className="admin-perm-chip">{p}</span>
          ))}
        </td>
        <td>{new Date(u.createdAt).toLocaleDateString("fr-DZ")}</td>
        <StatusCell u={u} />
      </tr>
    );
  };

  const CompanyRow = ({ u }: { u: User }) => {
    const company = u.companyAdmin?.company;
    const contact = u.companyAdmin
      ? `${u.companyAdmin.firstName ?? ""} ${u.companyAdmin.lastName ?? ""}`.trim() || "—"
      : "—";
    return (
      <tr style={{ opacity: u.isActive ? 1 : 0.5 }}>
        <td>
          <div className="admin-table__user">
            <span className="admin-table__avatar">{(company?.raisonSociale ?? u.email).charAt(0).toUpperCase()}</span>
            <div>
              <span className="admin-table__name">{company?.raisonSociale ?? "—"}</span>
              <span className="admin-table__email">{u.email}</span>
            </div>
          </div>
        </td>
        <td style={{ fontSize: 13 }}>{contact}</td>
        <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {[company?.commune, company?.wilaya].filter(Boolean).join(", ") || "—"}
        </td>
        <td>{new Date(u.createdAt).toLocaleDateString("fr-DZ")}</td>
        <StatusCell u={u} />
      </tr>
    );
  };

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title">Utilisateurs</h1>
        <button className="btn btn--primary" onClick={() => { setShowForm(true); setFormError(""); setForm(EMPTY_FORM); }} style={{ fontSize: 13 }}>
          + Ajouter un utilisateur
        </button>
      </div>

      {/* Modal création utilisateur */}
      {showForm && (
        <div className="admin-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="admin-modal admin-modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2 className="admin-modal__title">Nouvel utilisateur</h2>
              <button className="admin-modal__close" onClick={() => setShowForm(false)}>✕</button>
            </div>

            {formError && <div className="auth-error" style={{ marginBottom: 16 }}>{formError}</div>}

            <form onSubmit={handleCreate} className="auth-form">
              {/* Rôle */}
              <div className="auth-field">
                <label className="auth-label">Rôle *</label>
                <div className="role-selector">
                  {ROLE_OPTIONS.map((r) => (
                    <label
                      key={r.value}
                      className={`role-option${form.role === r.value ? " role-option--active" : ""}`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={r.value}
                        checked={form.role === r.value}
                        onChange={set("role")}
                        style={{ display: "none" }}
                      />
                      <span className="role-option__label">{r.label}</span>
                      <span className="role-option__desc">{r.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Permissions affichées */}
              <div className="auth-field">
                <label className="auth-label">Accès inclus</label>
                <div className="perm-preview">
                  {(ROLE_PERMISSIONS[form.role] ?? []).map((p) => (
                    <span key={p} className="perm-chip">{p}</span>
                  ))}
                </div>
              </div>

              {/* Email + mot de passe */}
              <div className="auth-row">
                <div className="auth-field">
                  <label className="auth-label">Email *</label>
                  <input type="email" className="auth-input" required value={form.email} onChange={set("email")} placeholder="email@exemple.com" />
                </div>
                <div className="auth-field">
                  <label className="auth-label">Mot de passe *</label>
                  <input type="password" className="auth-input" required value={form.password} onChange={set("password")} placeholder="Min. 8 caractères" minLength={8} />
                </div>
              </div>

              {/* Nom/Prénom — uniquement pour apprenant */}
              {isLearner && (
                <>
                  <div className="auth-row">
                    <div className="auth-field">
                      <label className="auth-label">Prénom *</label>
                      <input type="text" className="auth-input" required={isLearner} value={form.firstName} onChange={set("firstName")} placeholder="Prénom" />
                    </div>
                    <div className="auth-field">
                      <label className="auth-label">Nom *</label>
                      <input type="text" className="auth-input" required={isLearner} value={form.lastName} onChange={set("lastName")} placeholder="NOM" />
                    </div>
                  </div>
                  <div className="auth-field">
                    <label className="auth-label">Téléphone</label>
                    <input type="tel" className="auth-input" value={form.phone} onChange={set("phone")} placeholder="+213 XXX XXX XXX" />
                  </div>
                </>
              )}

              <div className="auth-form-actions">
                <button type="button" className="btn btn--outline" onClick={() => setShowForm(false)}>Annuler</button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? "Création…" : "Créer l'utilisateur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="admin-tabs">
        <button className={`admin-tab${tab === "learners" ? " admin-tab--active" : ""}`} onClick={() => setTab("learners")}>
          Apprenants
          <span className="admin-tab__count">{allLearners.length}</span>
        </button>
        <button className={`admin-tab${tab === "companies" ? " admin-tab--active" : ""}`} onClick={() => setTab("companies")}>
          Entreprises
          <span className="admin-tab__count">{allCompanies.length}</span>
        </button>
        <button className={`admin-tab${tab === "admins" ? " admin-tab--active" : ""}`} onClick={() => setTab("admins")}>
          Équipe administration
          <span className="admin-tab__count">{allAdmins.length}</span>
        </button>
      </div>

      <div className="admin-search" style={{ marginTop: 16 }}>
        <input type="text" placeholder="Rechercher par nom ou email…" className="auth-input" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading && <p className="admin-loading">Chargement…</p>}

      <div className="admin-table-wrap">
        {tab === "companies" ? (
          <table className="admin-table">
            <thead>
              <tr><th>Entreprise</th><th>Contact</th><th>Localisation</th><th>Inscription</th><th>Statut</th><th>Action</th></tr>
            </thead>
            <tbody>
              {filteredCompanies.length === 0 && !loading && (
                <tr><td colSpan={6} className="admin-table__empty">Aucune entreprise trouvée</td></tr>
              )}
              {filteredCompanies.map((u) => <CompanyRow key={u.id} u={u} />)}
            </tbody>
          </table>
        ) : (
          <table className="admin-table">
            <thead>
              <tr><th>Utilisateur</th><th>Rôle</th><th>Accès</th><th>Inscription</th><th>Statut</th><th>Action</th></tr>
            </thead>
            <tbody>
              {(tab === "learners" ? filteredLearners : filteredAdmins).length === 0 && !loading && (
                <tr><td colSpan={6} className="admin-table__empty">Aucun utilisateur trouvé</td></tr>
              )}
              {(tab === "learners" ? filteredLearners : filteredAdmins).map((u) => <UserRow key={u.id} u={u} />)}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
