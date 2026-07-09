"use client";

import { useEffect, useState } from "react";
import { adminApi as api } from "@/lib/adminApi";
import FileUpload from "@/app/components/FileUpload";

interface Category { id: string; name: string }
interface Session {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  duration: string | null;
  categoryId: string;
  category: Category;
  startDate: string;
  endDate: string | null;
  location: string | null;
  minCapacity: number;
  maxCapacity: number;
  status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  _count: { enrollments: number };
}

interface EditState {
  id: string | null;
  title: string;
  description: string;
  coverImageUrl: string | null;
  duration: string;
  categoryId: string;
  startDate: string;
  location: string;
  minCapacity: number;
  maxCapacity: number;
  status: Session["status"];
}

const EMPTY: EditState = {
  id: null,
  title: "",
  description: "",
  coverImageUrl: null,
  duration: "",
  categoryId: "",
  startDate: "",
  location: "",
  minCapacity: 1,
  maxCapacity: 20,
  status: "SCHEDULED",
};

const STATUS_LABELS: Record<Session["status"], string> = {
  SCHEDULED: "Programmée",
  ONGOING: "En cours",
  COMPLETED: "Clôturée",
  CANCELLED: "Annulée",
};

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get<Session[]>("/admin/sessions"),
      api.get<Category[]>("/categories"),
    ])
      .then(([s, c]) => { setSessions(s); setCategories(c); })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = sessions.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.category.name.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing({ ...EMPTY, categoryId: categories[0]?.id ?? "" });
    setSaveError("");
  };

  const openEdit = (s: Session) => {
    setEditing({
      id: s.id,
      title: s.title,
      description: s.description ?? "",
      coverImageUrl: s.coverImageUrl,
      duration: s.duration ?? "",
      categoryId: s.categoryId,
      startDate: s.startDate.slice(0, 10),
      location: s.location ?? "",
      minCapacity: s.minCapacity,
      maxCapacity: s.maxCapacity,
      status: s.status,
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
        title: editing.title,
        description: editing.description || null,
        coverImageUrl: editing.coverImageUrl,
        duration: editing.duration || null,
        categoryId: editing.categoryId,
        startDate: editing.startDate,
        location: editing.location || null,
        minCapacity: editing.minCapacity,
        maxCapacity: editing.maxCapacity,
        status: editing.status,
      };
      if (editing.id) {
        await api.patch(`/admin/sessions/${editing.id}`, payload);
      } else {
        await api.post("/admin/sessions", payload);
      }
      setEditing(null);
      load();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title">Sessions de formation</h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span className="admin-kpi admin-kpi--inline">{sessions.length} sessions</span>
          <button className="btn btn--primary" onClick={openCreate}>+ Nouvelle session</button>
        </div>
      </div>

      <div className="admin-search">
        <input
          type="text"
          placeholder="Rechercher par titre ou branche…"
          className="auth-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && <p className="admin-loading">Chargement…</p>}

      {editing && (
        <div className="admin-modal-overlay" onClick={() => setEditing(null)}>
          <div className="admin-modal admin-modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2 className="admin-modal__title" style={{ fontSize: 16 }}>
                {editing.id ? "Modifier la session" : "Nouvelle session"}
              </h2>
              <button className="admin-modal__close" onClick={() => setEditing(null)}>✕</button>
            </div>

            {saveError && <div className="auth-error">{saveError}</div>}

            <form onSubmit={handleSave} className="auth-form">
              <div className="auth-field">
                <label className="auth-label">Titre</label>
                <input
                  type="text" className="auth-input" required
                  value={editing.title}
                  onChange={(e) => setEditing((v) => v ? { ...v, title: e.target.value } : v)}
                  placeholder="Ex : Habilitation électrique BT"
                />
              </div>

              <div className="auth-row">
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
                <div className="auth-field">
                  <label className="auth-label">Durée</label>
                  <input
                    type="text" className="auth-input"
                    value={editing.duration}
                    onChange={(e) => setEditing((v) => v ? { ...v, duration: e.target.value } : v)}
                    placeholder="Ex : 3 jours"
                  />
                </div>
              </div>

              <div className="auth-row">
                <div className="auth-field">
                  <label className="auth-label">Date</label>
                  <input
                    type="date" className="auth-input" required
                    value={editing.startDate}
                    onChange={(e) => setEditing((v) => v ? { ...v, startDate: e.target.value } : v)}
                  />
                </div>
                <div className="auth-field">
                  <label className="auth-label">Lieu (optionnel)</label>
                  <input
                    type="text" className="auth-input"
                    value={editing.location}
                    onChange={(e) => setEditing((v) => v ? { ...v, location: e.target.value } : v)}
                    placeholder="Ex : Hydra, Alger"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label">Description</label>
                <textarea
                  className="auth-input" rows={3}
                  value={editing.description}
                  onChange={(e) => setEditing((v) => v ? { ...v, description: e.target.value } : v)}
                />
              </div>

              <FileUpload
                label="Image de couverture"
                accept="image/*"
                currentUrl={editing.coverImageUrl}
                hint="Affichée sur la carte de session"
                onUploaded={(url) => setEditing((v) => v ? { ...v, coverImageUrl: url } : v)}
                tokenStorageKey="admin_token"
              />

              <div className="auth-row">
                <div className="auth-field">
                  <label className="auth-label">Nombre d&apos;inscrits minimum</label>
                  <input
                    type="number" className="auth-input" min={1}
                    value={editing.minCapacity}
                    onChange={(e) => setEditing((v) => v ? { ...v, minCapacity: Number(e.target.value) } : v)}
                  />
                </div>
                <div className="auth-field">
                  <label className="auth-label">Nombre d&apos;inscrits maximum</label>
                  <input
                    type="number" className="auth-input" min={1}
                    value={editing.maxCapacity}
                    onChange={(e) => setEditing((v) => v ? { ...v, maxCapacity: Number(e.target.value) } : v)}
                  />
                </div>
              </div>

              {editing.id && (
                <div className="auth-field">
                  <label className="auth-label">Statut</label>
                  <select
                    className="auth-input"
                    value={editing.status}
                    onChange={(e) => setEditing((v) => v ? { ...v, status: e.target.value as Session["status"] } : v)}
                  >
                    {(Object.keys(STATUS_LABELS) as Session["status"][]).map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
              )}

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
              <th>Branche</th>
              <th>Date</th>
              <th>Durée</th>
              <th>Inscrits</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="admin-table__empty">Aucune session trouvée</td>
              </tr>
            )}
            {filtered.map((s) => (
              <tr key={s.id}>
                <td><span className="admin-table__name">{s.title}</span></td>
                <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.category.name}</td>
                <td style={{ fontSize: 13 }}>{new Date(s.startDate).toLocaleDateString("fr-FR")}</td>
                <td style={{ fontSize: 13 }}>{s.duration ?? <span style={{ color: "var(--border)" }}>—</span>}</td>
                <td style={{ fontSize: 13 }}>{s._count.enrollments} / {s.maxCapacity}</td>
                <td>
                  <span className={`admin-badge admin-badge--${s.status === "CANCELLED" ? "cancelled" : s.status === "COMPLETED" ? "cancelled" : "confirmed"}`}>
                    {STATUS_LABELS[s.status]}
                  </span>
                </td>
                <td>
                  <button className="admin-btn" onClick={() => openEdit(s)}>Modifier</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
