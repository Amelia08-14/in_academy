"use client";

import { useEffect, useState } from "react";
import { adminApi as api } from "@/lib/adminApi";
import FileUpload from "@/app/components/FileUpload";

const fileUrl = (url: string) => `/api/files/${url.replace("/uploads/", "")}`;

interface TrainerLink { trainer: { displayName: string } }
interface Category { id: string; name: string; _count?: { formations: number } }
interface Formation {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  duration: string | null;
  price: number | null;
  isActive: boolean;
  isCertifying: boolean;
  ficheTechniqueUrl: string | null;
  coverImageUrl: string | null;
  categoryId: string;
  category: { name: string } | null;
  trainers: TrainerLink[];
  _count: { sessions: number };
}

interface EditState {
  id: string | null;
  title: string;
  description: string;
  categoryId: string;
  ficheTechniqueUrl: string | null;
  coverImageUrl: string | null;
  price: number | null;
  duration: string | null;
  isActive: boolean;
  isCertifying: boolean;
}

const EMPTY: EditState = {
  id: null,
  title: "",
  description: "",
  categoryId: "",
  ficheTechniqueUrl: null,
  coverImageUrl: null,
  price: null,
  duration: null,
  isActive: true,
  isCertifying: true,
};

export default function AdminFormationsPage() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [showNewBranche, setShowNewBranche] = useState(false);
  const [brancheName, setBrancheName] = useState("");
  const [brancheDesc, setBrancheDesc] = useState("");
  const [savingBranche, setSavingBranche] = useState(false);
  const [brancheError, setBrancheError] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get<Formation[]>("/admin/formations"),
      api.get<Category[]>("/admin/categories"),
    ])
      .then(([f, c]) => { setFormations(f); setCategories(c); })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = formations.filter((f) =>
    f.title.toLowerCase().includes(search.toLowerCase()) ||
    (f.category?.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing({ ...EMPTY, categoryId: categories[0]?.id ?? "" });
    setSaveError("");
  };

  const openEdit = (f: Formation) => {
    setEditing({
      id: f.id,
      title: f.title,
      description: f.description ?? "",
      categoryId: f.categoryId,
      ficheTechniqueUrl: f.ficheTechniqueUrl,
      coverImageUrl: f.coverImageUrl,
      price: f.price,
      duration: f.duration,
      isActive: f.isActive,
      isCertifying: f.isCertifying,
    });
    setSaveError("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setSaveError("");
    try {
      if (editing.id) {
        await api.patch(`/admin/formations/${editing.id}`, {
          ficheTechniqueUrl: editing.ficheTechniqueUrl,
          coverImageUrl: editing.coverImageUrl,
          description: editing.description || null,
          price: editing.price,
          duration: editing.duration,
          isActive: editing.isActive,
        });
      } else {
        await api.post("/admin/formations", {
          title: editing.title,
          categoryId: editing.categoryId,
          description: editing.description || undefined,
          duration: editing.duration || undefined,
          price: editing.price ?? undefined,
          isCertifying: editing.isCertifying,
          ficheTechniqueUrl: editing.ficheTechniqueUrl ?? undefined,
          coverImageUrl: editing.coverImageUrl ?? undefined,
        });
      }
      setEditing(null);
      load();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateBranche = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBranche(true);
    setBrancheError("");
    try {
      await api.post("/admin/categories", { name: brancheName, description: brancheDesc || undefined });
      setShowNewBranche(false);
      setBrancheName("");
      setBrancheDesc("");
      load();
    } catch (err: unknown) {
      setBrancheError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSavingBranche(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title">Formations</h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span className="admin-kpi admin-kpi--inline">{formations.length} formations</span>
          <button className="btn btn--outline" style={{ fontSize: 13 }} onClick={() => setShowNewBranche(true)}>
            + Nouvelle branche
          </button>
          <button className="btn btn--primary" style={{ fontSize: 13 }} onClick={openCreate}>
            + Nouvelle formation
          </button>
        </div>
      </div>

      <div className="admin-search">
        <input
          type="text"
          placeholder="Rechercher par titre ou domaine…"
          className="auth-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && <p className="admin-loading">Chargement…</p>}

      {/* Modal nouvelle branche */}
      {showNewBranche && (
        <div className="admin-modal-overlay" onClick={() => setShowNewBranche(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2 className="admin-modal__title">Nouvelle branche</h2>
              <button className="admin-modal__close" onClick={() => setShowNewBranche(false)}>✕</button>
            </div>
            {brancheError && <div className="auth-error">{brancheError}</div>}
            <form onSubmit={handleCreateBranche} className="auth-form">
              <div className="auth-field">
                <label className="auth-label">Nom de la branche</label>
                <input
                  type="text" className="auth-input" required
                  value={brancheName} onChange={(e) => setBrancheName(e.target.value)}
                  placeholder="Ex : Cybersécurité"
                />
              </div>
              <div className="auth-field">
                <label className="auth-label">Description (optionnel)</label>
                <textarea
                  className="auth-input" rows={3}
                  value={brancheDesc} onChange={(e) => setBrancheDesc(e.target.value)}
                />
              </div>
              <div className="auth-form-actions">
                <button type="button" className="btn btn--outline" onClick={() => setShowNewBranche(false)}>Annuler</button>
                <button type="submit" className="btn btn--primary" disabled={savingBranche}>
                  {savingBranche ? "Création…" : "Créer la branche"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal création/édition formation */}
      {editing && (
        <div className="admin-modal-overlay" onClick={() => setEditing(null)}>
          <div className="admin-modal admin-modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2 className="admin-modal__title" style={{ fontSize: 16 }}>
                {editing.id ? editing.title : "Nouvelle formation"}
              </h2>
              <button className="admin-modal__close" onClick={() => setEditing(null)}>✕</button>
            </div>

            {saveError && <div className="auth-error">{saveError}</div>}

            <form onSubmit={handleSave} className="auth-form">
              {!editing.id && (
                <>
                  <div className="auth-field">
                    <label className="auth-label">Titre</label>
                    <input
                      type="text" className="auth-input" required
                      value={editing.title}
                      onChange={(e) => setEditing((v) => v ? { ...v, title: e.target.value } : v)}
                      placeholder="Ex : Gestion de projet agile"
                    />
                  </div>
                  <div className="auth-field">
                    <label className="auth-label">Branche</label>
                    <select
                      className="auth-input" required
                      value={editing.categoryId}
                      onChange={(e) => setEditing((v) => v ? { ...v, categoryId: e.target.value } : v)}
                    >
                      <option value="" disabled>Choisir…</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="auth-field">
                <label className="auth-label">Description</label>
                <textarea
                  className="auth-input" rows={4}
                  value={editing.description}
                  onChange={(e) => setEditing((v) => v ? { ...v, description: e.target.value } : v)}
                  placeholder="Objectifs, contenu, public visé…"
                />
              </div>

              {/* Photo de couverture */}
              <FileUpload
                label="Photo de couverture"
                accept="image/*"
                currentUrl={editing.coverImageUrl}
                hint="Affichée sur la carte de la formation — format paysage recommandé"
                onUploaded={(url) => setEditing((v) => v ? { ...v, coverImageUrl: url } : v)}
                tokenStorageKey="admin_token"
              />

              {/* Fiche technique */}
              <FileUpload
                label="Fiche technique (PDF)"
                accept=".pdf,.doc,.docx"
                currentUrl={editing.ficheTechniqueUrl}
                hint="Programme détaillé de la formation — PDF recommandé"
                onUploaded={(url) => setEditing((v) => v ? { ...v, ficheTechniqueUrl: url } : v)}
                tokenStorageKey="admin_token"
              />

              <div className="auth-row">
                <div className="auth-field">
                  <label className="auth-label">Durée</label>
                  <input
                    type="text" className="auth-input"
                    value={editing.duration ?? ""}
                    onChange={(e) => setEditing((v) => v ? { ...v, duration: e.target.value } : v)}
                    placeholder="Ex : 3 jours, 21h"
                  />
                </div>
                <div className="auth-field">
                  <label className="auth-label">Tarif (DA)</label>
                  <input
                    type="number" className="auth-input"
                    value={editing.price ?? ""}
                    onChange={(e) => setEditing((v) => v ? { ...v, price: e.target.value ? Number(e.target.value) : null } : v)}
                    placeholder="Ex : 25000"
                    min={0}
                  />
                </div>
              </div>

              <div className="auth-field" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editing.isActive}
                  onChange={(e) => setEditing((v) => v ? { ...v, isActive: e.target.checked } : v)}
                  style={{ width: 18, height: 18, accentColor: "var(--gold)", cursor: "pointer" }}
                />
                <label htmlFor="isActive" className="auth-label" style={{ marginBottom: 0, cursor: "pointer" }}>
                  Formation active (visible dans le catalogue)
                </label>
              </div>

              <div className="auth-form-actions">
                <button type="button" className="btn btn--outline" onClick={() => setEditing(null)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Titre</th>
              <th>Domaine</th>
              <th>Formateur(s)</th>
              <th>Durée</th>
              <th>Tarif</th>
              <th>Fiche</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && !loading && (
              <tr>
                <td colSpan={8} className="admin-table__empty">Aucune formation trouvée</td>
              </tr>
            )}
            {filtered.map((f) => (
              <tr key={f.id} style={{ opacity: f.isActive ? 1 : 0.55 }}>
                <td>
                  <span className="admin-table__name">{f.title}</span>
                </td>
                <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {f.category?.name ?? "—"}
                </td>
                <td style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 160 }}>
                  {f.trainers.length > 0
                    ? f.trainers.map((t) => t.trainer.displayName).join(", ")
                    : <span style={{ color: "var(--border)" }}>—</span>
                  }
                </td>
                <td style={{ fontSize: 13 }}>
                  {f.duration ?? <span style={{ color: "var(--border)" }}>—</span>}
                </td>
                <td style={{ fontSize: 13 }}>
                  {f.price != null
                    ? `${f.price.toLocaleString("fr-DZ")} DA`
                    : <span style={{ color: "var(--border)" }}>—</span>
                  }
                </td>
                <td>
                  {f.ficheTechniqueUrl ? (
                    <a
                      href={fileUrl(f.ficheTechniqueUrl!)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-file-link"
                      title="Télécharger la fiche technique"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
                      </svg>
                      PDF
                    </a>
                  ) : (
                    <span style={{ color: "var(--border)", fontSize: 12 }}>—</span>
                  )}
                </td>
                <td>
                  <span className={`admin-badge admin-badge--${f.isActive ? "confirmed" : "cancelled"}`}>
                    {f.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <button className="admin-btn" onClick={() => openEdit(f)}>
                    Modifier
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
