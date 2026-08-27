"use client";

import { useEffect, useState } from "react";
import { adminApi as api } from "@/lib/adminApi";
import { fileUrl } from "@/lib/fileUrl";
import FileUpload from "@/app/components/FileUpload";

interface EventPhoto { id: string; photoUrl: string }
interface EventItem {
  id: string;
  title: string;
  eventDate: string;
  location: string | null;
  summary: string | null;
  isPublished: boolean;
  photos: EventPhoto[];
  createdAt: string;
}

interface EditState {
  id: string | null;
  title: string;
  eventDate: string;
  location: string;
  summary: string;
  isPublished: boolean;
  photoUrls: string[];
}

const EMPTY: EditState = { id: null, title: "", eventDate: "", location: "", summary: "", isPublished: false, photoUrls: [] };

export default function AdminEvenementsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const load = () => {
    setLoading(true);
    api.get<EventItem[]>("/admin/events").then(setEvents).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openEdit = (ev: EventItem) => {
    setEditing({
      id: ev.id,
      title: ev.title,
      eventDate: ev.eventDate.slice(0, 10),
      location: ev.location ?? "",
      summary: ev.summary ?? "",
      isPublished: ev.isPublished,
      photoUrls: ev.photos.map((p) => p.photoUrl),
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
        eventDate: editing.eventDate,
        location: editing.location || undefined,
        summary: editing.summary || undefined,
        isPublished: editing.isPublished,
        photoUrls: editing.photoUrls,
      };
      if (editing.id) await api.patch(`/admin/events/${editing.id}`, payload);
      else await api.post("/admin/events", payload);
      setEditing(null);
      load();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Supprimer cet événement ?")) return;
    await api.delete(`/admin/events/${id}`);
    load();
  };

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div className="admin-page__heading">
          <h1 className="admin-page__title">Nos Events</h1>
          <p className="admin-page__subtitle">Dates, photos et retours d&apos;expérience des événements IN ACADEMY.</p>
        </div>
        <button className="btn btn--primary" style={{ fontSize: 13 }} onClick={() => { setEditing({ ...EMPTY }); setSaveError(""); }}>
          + Nouvel événement
        </button>
      </div>

      {loading && <p className="admin-loading">Chargement…</p>}

      {editing && (
        <div className="admin-modal-overlay" onClick={() => setEditing(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2 className="admin-modal__title" style={{ fontSize: 16 }}>
                {editing.id ? "Modifier l'événement" : "Nouvel événement"}
              </h2>
              <button className="admin-modal__close" onClick={() => setEditing(null)}>✕</button>
            </div>

            {saveError && <div className="auth-error">{saveError}</div>}

            <form onSubmit={handleSave} className="auth-form">
              <div className="auth-field">
                <label className="auth-label">Titre *</label>
                <input
                  type="text" className="auth-input" required
                  value={editing.title}
                  onChange={(e) => setEditing((v) => v ? { ...v, title: e.target.value } : v)}
                  placeholder="Ex : Journée portes ouvertes 2026"
                />
              </div>
              <div className="auth-row">
                <div className="auth-field">
                  <label className="auth-label">Date *</label>
                  <input
                    type="date" className="auth-input" required
                    value={editing.eventDate}
                    onChange={(e) => setEditing((v) => v ? { ...v, eventDate: e.target.value } : v)}
                  />
                </div>
                <div className="auth-field">
                  <label className="auth-label">Lieu</label>
                  <input
                    type="text" className="auth-input"
                    value={editing.location}
                    onChange={(e) => setEditing((v) => v ? { ...v, location: e.target.value } : v)}
                    placeholder="Ex : Siège IN ACADEMY, Hydra"
                  />
                </div>
              </div>
              <div className="auth-field">
                <label className="auth-label">Retour d&apos;expérience</label>
                <textarea
                  className="auth-input" rows={4}
                  value={editing.summary}
                  onChange={(e) => setEditing((v) => v ? { ...v, summary: e.target.value } : v)}
                  placeholder="Déroulé, points marquants, retours des participants…"
                />
              </div>

              <FileUpload
                label="Photos de l'événement"
                accept=".png,.jpg,.jpeg"
                hint="Ajoutez une photo à la fois — elles s'empilent ci-dessous."
                onUploaded={(url) => setEditing((v) => v ? { ...v, photoUrls: [...v.photoUrls, url] } : v)}
                tokenStorageKey="admin_token"
              />
              {editing.photoUrls.length > 0 && (
                <ul className="collab-fiches">
                  {editing.photoUrls.map((url, i) => (
                    <li key={i}>
                      <a href={fileUrl(url)} target="_blank" rel="noopener noreferrer">📷 Photo {i + 1}</a>
                      <button
                        type="button"
                        aria-label="Retirer"
                        onClick={() => setEditing((v) => v ? { ...v, photoUrls: v.photoUrls.filter((_, j) => j !== i) } : v)}
                      >✕</button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="auth-field" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <input
                  type="checkbox" id="isPublished"
                  checked={editing.isPublished}
                  onChange={(e) => setEditing((v) => v ? { ...v, isPublished: e.target.checked } : v)}
                  style={{ width: 18, height: 18, accentColor: "var(--gold)", cursor: "pointer" }}
                />
                <label htmlFor="isPublished" className="auth-label" style={{ marginBottom: 0, cursor: "pointer" }}>
                  Publié sur la page « Nos Events »
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
            <tr><th>Événement</th><th>Date</th><th>Lieu</th><th>Photos</th><th>Statut</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {events.length === 0 && !loading && (
              <tr><td colSpan={6} className="admin-table__empty">Aucun événement pour l&apos;instant.</td></tr>
            )}
            {events.map((ev) => (
              <tr key={ev.id} style={{ opacity: ev.isPublished ? 1 : 0.55 }}>
                <td><span className="admin-table__name">{ev.title}</span></td>
                <td style={{ fontSize: 13 }}>{new Date(ev.eventDate).toLocaleDateString("fr-FR")}</td>
                <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{ev.location ?? "—"}</td>
                <td style={{ fontSize: 13 }}>{ev.photos.length}</td>
                <td>
                  <span className={`admin-badge admin-badge--${ev.isPublished ? "confirmed" : "cancelled"}`}>
                    {ev.isPublished ? "Publié" : "Brouillon"}
                  </span>
                </td>
                <td>
                  <div className="admin-cell-actions">
                    <button className="admin-btn" onClick={() => openEdit(ev)}>Modifier</button>
                    <button className="admin-btn admin-btn--cancel" onClick={() => remove(ev.id)}>Supprimer</button>
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
