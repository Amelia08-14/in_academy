"use client";

import { useEffect, useState } from "react";
import { adminApi as api } from "@/lib/adminApi";

interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isMetier: boolean;
  _count: { formations: number; sessions: number };
}

interface EditState {
  id: string | null;
  name: string;
  description: string;
  isMetier: boolean;
}

const EMPTY: EditState = { id: null, name: "", description: "", isMetier: false };

type Filter = "all" | "entreprise" | "metier";

export default function AdminBranchesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const load = () => {
    setLoading(true);
    api.get<Category[]>("/admin/categories")
      .then(setCategories)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void Promise.resolve().then(load);
  }, []);

  const counts = {
    entreprise: categories.filter((c) => !c.isMetier).length,
    metier: categories.filter((c) => c.isMetier).length,
  };

  const filtered = categories.filter((c) =>
    filter === "all" ? true : filter === "metier" ? c.isMetier : !c.isMetier
  );

  const openCreate = () => {
    setEditing({ ...EMPTY, isMetier: filter === "metier" });
    setSaveError("");
  };

  const openEdit = (c: Category) => {
    setEditing({ id: c.id, name: c.name, description: c.description ?? "", isMetier: c.isMetier });
    setSaveError("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setSaveError("");
    try {
      const payload = {
        name: editing.name,
        description: editing.description || null,
        isMetier: editing.isMetier,
      };
      if (editing.id) {
        await api.patch(`/admin/categories/${editing.id}`, payload);
      } else {
        await api.post("/admin/categories", payload);
      }
      setEditing(null);
      load();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: Category) => {
    if (!window.confirm(`Supprimer définitivement la branche « ${c.name} » ?`)) return;
    try {
      await api.delete(`/admin/categories/${c.id}`);
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur lors de la suppression");
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title">Branches</h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span className="admin-kpi admin-kpi--inline">
            {counts.entreprise} entreprises · {counts.metier} métiers
          </span>
          <button className="btn btn--primary" onClick={openCreate}>+ Nouvelle branche</button>
        </div>
      </div>

      <div className="admin-tabs" role="tablist">
        <button role="tab" className={`admin-tab ${filter === "all" ? "admin-tab--active" : ""}`} onClick={() => setFilter("all")}>
          Toutes
        </button>
        <button role="tab" className={`admin-tab ${filter === "entreprise" ? "admin-tab--active" : ""}`} onClick={() => setFilter("entreprise")}>
          Entreprise
        </button>
        <button role="tab" className={`admin-tab ${filter === "metier" ? "admin-tab--active" : ""}`} onClick={() => setFilter("metier")}>
          Métiers
        </button>
      </div>

      {loading && <p className="admin-loading">Chargement…</p>}

      {editing && (
        <div className="admin-modal-overlay" onClick={() => setEditing(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2 className="admin-modal__title" style={{ fontSize: 16 }}>
                {editing.id ? "Modifier la branche" : "Nouvelle branche"}
              </h2>
              <button className="admin-modal__close" onClick={() => setEditing(null)}>✕</button>
            </div>

            {saveError && <div className="auth-error">{saveError}</div>}

            <form onSubmit={handleSave} className="auth-form">
              <div className="auth-field">
                <label className="auth-label">Nom de la branche</label>
                <input
                  type="text" className="auth-input" required
                  value={editing.name}
                  onChange={(e) => setEditing((v) => v ? { ...v, name: e.target.value } : v)}
                  placeholder="Ex : IT & Digital"
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">Type</label>
                <select
                  className="auth-input"
                  value={editing.isMetier ? "metier" : "entreprise"}
                  onChange={(e) => setEditing((v) => v ? { ...v, isMetier: e.target.value === "metier" } : v)}
                >
                  <option value="entreprise">Entreprise (page Formations Entreprises)</option>
                  <option value="metier">Métier (page Formations Métiers)</option>
                </select>
              </div>

              <div className="auth-field">
                <label className="auth-label">Description (optionnel)</label>
                <textarea
                  className="auth-input" rows={3}
                  value={editing.description}
                  onChange={(e) => setEditing((v) => v ? { ...v, description: e.target.value } : v)}
                />
              </div>

              <div className="auth-form-actions">
                <button type="button" className="btn btn--outline" onClick={() => setEditing(null)}>Annuler</button>
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
              <th>Nom</th>
              <th>Type</th>
              <th>Formations</th>
              <th>Sessions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && !loading && (
              <tr><td colSpan={5} className="admin-table__empty">Aucune branche</td></tr>
            )}
            {filtered.map((c) => (
              <tr key={c.id}>
                <td>
                  <span className="admin-table__name">{c.name}</span>
                  <span className="admin-table__email">/{c.slug}</span>
                </td>
                <td>
                  <span className={`admin-badge admin-badge--${c.isMetier ? "pending" : "confirmed"}`}>
                    {c.isMetier ? "Métier" : "Entreprise"}
                  </span>
                </td>
                <td style={{ fontSize: 13 }}>{c._count.formations}</td>
                <td style={{ fontSize: 13 }}>{c._count.sessions}</td>
                <td>
                  <div className="admin-cell-actions">
                    <button className="admin-btn" onClick={() => openEdit(c)}>Modifier</button>
                    <button className="admin-btn admin-btn--cancel" onClick={() => remove(c)}>Supprimer</button>
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
