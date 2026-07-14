"use client";

import { useEffect, useState } from "react";
import { adminApi as api } from "@/lib/adminApi";
import FileUpload from "@/app/components/FileUpload";

import { fileUrl } from "@/lib/fileUrl";

interface Formation { id: string; title: string }
interface FormationLink { formation: Formation; isPrimary: boolean }
interface Trainer {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  speciality: string | null;
  bio: string | null;
  cvUrl: string | null;
  isActive: boolean;
  formations: FormationLink[];
}

const EMPTY_FORM = {
  firstName: "", lastName: "", displayName: "",
  email: "", phone: "", speciality: "", bio: "", cvUrl: "",
};

export default function AdminFormateursPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Trainer | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    api.get<Trainer[]>("/trainers")
      .then(setTrainers)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = trainers.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.displayName.toLowerCase().includes(q) ||
      (t.speciality ?? "").toLowerCase().includes(q) ||
      (t.email ?? "").toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowForm(true);
  };

  const openEdit = (t: Trainer) => {
    setEditing(t);
    setForm({
      firstName:   t.firstName,
      lastName:    t.lastName,
      displayName: t.displayName,
      email:       t.email ?? "",
      phone:       t.phone ?? "",
      speciality:  t.speciality ?? "",
      bio:         t.bio ?? "",
      cvUrl:       t.cvUrl ?? "",
    });
    setError("");
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await api.patch(`/trainers/${editing.id}`, form);
      } else {
        await api.post("/trainers", form);
      }
      setShowForm(false);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (t: Trainer) => {
    await api.patch(`/trainers/${t.id}`, { isActive: !t.isActive });
    load();
  };

  const set = (field: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((v) => ({ ...v, [field]: e.target.value }));

  // Auto-generate displayName from firstName + lastName
  const handleNameChange = (field: "firstName" | "lastName") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setForm((v) => {
        const updated = { ...v, [field]: val };
        const fn = field === "firstName" ? val : v.firstName;
        const ln = field === "lastName" ? val : v.lastName;
        if (!v.displayName || v.displayName === `${v.firstName} ${v.lastName}`) {
          updated.displayName = `${fn} ${ln}`.trim();
        }
        return updated;
      });
    };

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title">Formateurs</h1>
        <button className="btn btn--primary" onClick={openCreate} style={{ fontSize: 13 }}>
          + Ajouter un formateur
        </button>
      </div>

      <div className="admin-search">
        <input
          type="text"
          placeholder="Rechercher par nom, spécialité, email…"
          className="auth-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Formulaire ajout / édition ── */}
      {showForm && (
        <div className="admin-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2 className="admin-modal__title">
                {editing ? "Modifier le formateur" : "Nouveau formateur"}
              </h2>
              <button className="admin-modal__close" onClick={() => setShowForm(false)}>✕</button>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSave} className="auth-form">
              <div className="auth-row">
                <div className="auth-field">
                  <label className="auth-label">Prénom *</label>
                  <input
                    type="text" className="auth-input" required
                    value={form.firstName} onChange={handleNameChange("firstName")}
                    placeholder="Prénom"
                  />
                </div>
                <div className="auth-field">
                  <label className="auth-label">Nom *</label>
                  <input
                    type="text" className="auth-input" required
                    value={form.lastName} onChange={handleNameChange("lastName")}
                    placeholder="NOM"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label">Nom d'affichage *</label>
                <input
                  type="text" className="auth-input" required
                  value={form.displayName} onChange={set("displayName")}
                  placeholder="M. NOM Prénom"
                />
              </div>

              <div className="auth-row">
                <div className="auth-field">
                  <label className="auth-label">Email</label>
                  <input
                    type="email" className="auth-input"
                    value={form.email} onChange={set("email")}
                    placeholder="formateur@email.com"
                  />
                </div>
                <div className="auth-field">
                  <label className="auth-label">Téléphone</label>
                  <input
                    type="tel" className="auth-input"
                    value={form.phone} onChange={set("phone")}
                    placeholder="+213 XXX XXX XXX"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label">Spécialité / Domaine</label>
                <input
                  type="text" className="auth-input"
                  value={form.speciality} onChange={set("speciality")}
                  placeholder="Ex: Finance & Comptabilité, HSE, Management…"
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">Bio / Présentation</label>
                <textarea
                  className="auth-input" rows={3}
                  value={form.bio} onChange={set("bio")}
                  placeholder="Présentation courte du formateur…"
                  style={{ resize: "vertical" }}
                />
              </div>

              <FileUpload
                label="CV du formateur (PDF)"
                accept=".pdf,.doc,.docx"
                currentUrl={form.cvUrl || null}
                hint="PDF ou Word — max 15 Mo"
                onUploaded={(url) => setForm((v) => ({ ...v, cvUrl: url }))}
                tokenStorageKey="admin_token"
              />

              <div className="auth-form-actions">
                <button type="button" className="btn btn--outline" onClick={() => setShowForm(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? "Enregistrement…" : editing ? "Mettre à jour" : "Créer le formateur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Tableau ── */}
      {loading && <p className="admin-loading">Chargement…</p>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Formateur</th>
              <th>Spécialité</th>
              <th>Formations</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && !loading && (
              <tr><td colSpan={5} className="admin-table__empty">Aucun formateur trouvé</td></tr>
            )}
            {filtered.map((t) => (
              <tr key={t.id} style={{ opacity: t.isActive ? 1 : 0.55 }}>
                <td>
                  <div className="admin-table__user">
                    <span className="admin-table__avatar">{t.lastName.charAt(0)}</span>
                    <div>
                      <span className="admin-table__name">{t.displayName}</span>
                      {t.email && <span className="admin-table__email">{t.email}</span>}
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 200 }}>
                  {t.speciality ?? "—"}
                </td>
                <td>
                  <span className="admin-kpi admin-kpi--inline">{t.formations.length} formation{t.formations.length !== 1 ? "s" : ""}</span>
                </td>
                <td>
                  <span className={`admin-badge admin-badge--${t.isActive ? "confirmed" : "cancelled"}`}>
                    {t.isActive ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td>
                  <div className="admin-actions">
                    {t.cvUrl && (
                      <a
                        href={fileUrl(t.cvUrl!)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-btn"
                        title="Télécharger le CV"
                      >
                        📄 CV
                      </a>
                    )}
                    <button className="admin-btn" onClick={() => openEdit(t)}>Modifier</button>
                    <button
                      className={`admin-btn ${t.isActive ? "admin-btn--cancel" : "admin-btn--confirm"}`}
                      onClick={() => handleToggle(t)}
                    >
                      {t.isActive ? "Désactiver" : "Activer"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
