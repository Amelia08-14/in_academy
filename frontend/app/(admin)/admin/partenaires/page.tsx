"use client";

import { useEffect, useState } from "react";
import { adminApi as api } from "@/lib/adminApi";

interface Partner {
  id: string;
  name: string;
  description: string | null;
  discountRate: string | null;
  contact: string | null;
  isActive: boolean;
  createdAt: string;
}

interface EditState {
  id: string | null;
  name: string;
  description: string;
  discountRate: string;
  contact: string;
  isActive: boolean;
}

const EMPTY: EditState = { id: null, name: "", description: "", discountRate: "", contact: "", isActive: true };

export default function AdminPartenairesPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const load = () => {
    setLoading(true);
    api.get<Partner[]>("/admin/partners").then(setPartners).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openEdit = (p: Partner) => {
    setEditing({
      id: p.id,
      name: p.name,
      description: p.description ?? "",
      discountRate: p.discountRate ?? "",
      contact: p.contact ?? "",
      isActive: p.isActive,
    });
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
        description: editing.description || undefined,
        discountRate: editing.discountRate || undefined,
        contact: editing.contact || undefined,
        isActive: editing.isActive,
      };
      if (editing.id) await api.patch(`/admin/partners/${editing.id}`, payload);
      else await api.post("/admin/partners", payload);
      setEditing(null);
      load();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Supprimer ce partenaire ?")) return;
    await api.delete(`/admin/partners/${id}`);
    load();
  };

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title">Partenaires & avantages</h1>
        <button className="btn btn--primary" style={{ fontSize: 13 }} onClick={() => { setEditing({ ...EMPTY }); setSaveError(""); }}>
          + Nouveau partenaire
        </button>
      </div>

      {loading && <p className="admin-loading">Chargement…</p>}

      {editing && (
        <div className="admin-modal-overlay" onClick={() => setEditing(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2 className="admin-modal__title" style={{ fontSize: 16 }}>
                {editing.id ? "Modifier le partenaire" : "Nouveau partenaire"}
              </h2>
              <button className="admin-modal__close" onClick={() => setEditing(null)}>✕</button>
            </div>

            {saveError && <div className="auth-error">{saveError}</div>}

            <form onSubmit={handleSave} className="auth-form">
              <div className="auth-field">
                <label className="auth-label">Nom du partenaire *</label>
                <input
                  type="text" className="auth-input" required
                  value={editing.name}
                  onChange={(e) => setEditing((v) => v ? { ...v, name: e.target.value } : v)}
                  placeholder="Ex : Hôtel Hydra"
                />
              </div>
              <div className="auth-row">
                <div className="auth-field">
                  <label className="auth-label">Réduction / avantage</label>
                  <input
                    type="text" className="auth-input"
                    value={editing.discountRate}
                    onChange={(e) => setEditing((v) => v ? { ...v, discountRate: e.target.value } : v)}
                    placeholder="Ex : -20% sur l'hébergement"
                  />
                </div>
                <div className="auth-field">
                  <label className="auth-label">Contact</label>
                  <input
                    type="text" className="auth-input"
                    value={editing.contact}
                    onChange={(e) => setEditing((v) => v ? { ...v, contact: e.target.value } : v)}
                    placeholder="Tél. / email / adresse"
                  />
                </div>
              </div>
              <div className="auth-field">
                <label className="auth-label">Description</label>
                <textarea
                  className="auth-input" rows={3}
                  value={editing.description}
                  onChange={(e) => setEditing((v) => v ? { ...v, description: e.target.value } : v)}
                  placeholder="Détails de l'offre proposée aux apprenants IN ACADEMY…"
                />
              </div>
              <div className="auth-field" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <input
                  type="checkbox" id="isActive"
                  checked={editing.isActive}
                  onChange={(e) => setEditing((v) => v ? { ...v, isActive: e.target.checked } : v)}
                  style={{ width: 18, height: 18, accentColor: "var(--gold)", cursor: "pointer" }}
                />
                <label htmlFor="isActive" className="auth-label" style={{ marginBottom: 0, cursor: "pointer" }}>
                  Avantage visible dans l&apos;espace client
                </label>
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
            <tr><th>Partenaire</th><th>Avantage</th><th>Contact</th><th>Statut</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {partners.length === 0 && !loading && (
              <tr><td colSpan={5} className="admin-table__empty">Aucun partenaire. Ajoutez « Hôtel Hydra » comme premier avantage.</td></tr>
            )}
            {partners.map((p) => (
              <tr key={p.id} style={{ opacity: p.isActive ? 1 : 0.55 }}>
                <td><span className="admin-table__name">{p.name}</span></td>
                <td style={{ fontSize: 13 }}>{p.discountRate ?? <span style={{ color: "var(--border)" }}>—</span>}</td>
                <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{p.contact ?? "—"}</td>
                <td>
                  <span className={`admin-badge admin-badge--${p.isActive ? "confirmed" : "cancelled"}`}>
                    {p.isActive ? "Visible" : "Masqué"}
                  </span>
                </td>
                <td style={{ display: "flex", gap: 8 }}>
                  <button className="admin-btn" onClick={() => openEdit(p)}>Modifier</button>
                  <button className="admin-btn admin-btn--cancel" onClick={() => remove(p.id)}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
