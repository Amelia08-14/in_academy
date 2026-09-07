"use client";

import { useEffect, useState } from "react";
import { adminApi as api } from "@/lib/adminApi";
import { fileUrl } from "@/lib/fileUrl";
import FileUpload from "@/app/components/FileUpload";

interface EventPhoto { id: string; photoUrl: string }
interface EventItem {
  id: string;
  slug: string;
  title: string;
  eventDate: string;
  location: string | null;
  summary: string | null;
  capacity: number | null;
  isPublished: boolean;
  photos: EventPhoto[];
  createdAt: string;
  _count: { registrations: number };
}

type RegistrationStatus = "PENDING" | "CONFIRMED" | "REJECTED";
interface Registration {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  jobTitle: string | null;
  trainingDomain: string | null;
  userId: string | null;
  status: RegistrationStatus;
  createdAt: string;
}

const REG_STATUS_LABEL: Record<RegistrationStatus, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  REJECTED: "Refusée",
};
const REG_STATUS_CLS: Record<RegistrationStatus, string> = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  REJECTED: "cancelled",
};

interface EditState {
  id: string | null;
  title: string;
  eventDate: string;
  location: string;
  summary: string;
  capacity: string;
  isPublished: boolean;
  photoUrls: string[];
}

const EMPTY: EditState = { id: null, title: "", eventDate: "", location: "", summary: "", capacity: "", isPublished: false, photoUrls: [] };

export default function AdminEvenementsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [viewingRegs, setViewingRegs] = useState<EventItem | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [regsLoading, setRegsLoading] = useState(false);

  const load = () => {
    setLoading(true);
    setLoadError("");
    api.get<EventItem[]>("/admin/events")
      .then(setEvents)
      .catch((err: unknown) => setLoadError(err instanceof Error ? err.message : "Erreur de chargement."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openEdit = (ev: EventItem) => {
    setEditing({
      id: ev.id,
      title: ev.title,
      eventDate: ev.eventDate.slice(0, 10),
      location: ev.location ?? "",
      summary: ev.summary ?? "",
      capacity: ev.capacity !== null ? String(ev.capacity) : "",
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
        capacity: editing.capacity.trim() ? Number(editing.capacity) : null,
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
    try {
      await api.delete(`/admin/events/${id}`);
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur lors de la suppression.");
    }
  };

  const openRegistrations = (ev: EventItem) => {
    setViewingRegs(ev);
    setRegsLoading(true);
    api.get<Registration[]>(`/admin/events/${ev.id}/registrations`)
      .then(setRegistrations)
      .catch((err: unknown) => alert(err instanceof Error ? err.message : "Erreur de chargement des inscrits."))
      .finally(() => setRegsLoading(false));
  };

  const confirmRegistration = async (id: string) => {
    try {
      const updated = await api.patch<Registration>(`/admin/events/registrations/${id}/confirm`);
      setRegistrations((r) => r.map((reg) => reg.id === id ? updated : reg));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur lors de la validation.");
    }
  };

  const rejectRegistration = async (id: string) => {
    try {
      const updated = await api.patch<Registration>(`/admin/events/registrations/${id}/reject`);
      setRegistrations((r) => r.map((reg) => reg.id === id ? updated : reg));
      setEvents((evs) => evs.map((ev) =>
        viewingRegs && ev.id === viewingRegs.id
          ? { ...ev, _count: { registrations: ev._count.registrations - 1 } }
          : ev
      ));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur lors du refus.");
    }
  };

  const removeRegistration = async (id: string) => {
    if (!window.confirm("Retirer définitivement cet inscrit ?")) return;
    try {
      const wasActive = registrations.find((r) => r.id === id)?.status !== "REJECTED";
      await api.delete(`/admin/events/registrations/${id}`);
      setRegistrations((r) => r.filter((reg) => reg.id !== id));
      if (wasActive) {
        setEvents((evs) => evs.map((ev) =>
          viewingRegs && ev.id === viewingRegs.id
            ? { ...ev, _count: { registrations: ev._count.registrations - 1 } }
            : ev
        ));
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur lors du retrait.");
    }
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
                <label className="auth-label">Nombre maximum d&apos;inscrits</label>
                <input
                  type="number" min={1} className="auth-input"
                  value={editing.capacity}
                  onChange={(e) => setEditing((v) => v ? { ...v, capacity: e.target.value } : v)}
                  placeholder="Laisser vide = illimité"
                />
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

      {loadError && (
        <div className="auth-error" style={{ marginBottom: 16 }}>
          Impossible de charger les événements : {loadError}
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Événement</th><th>Date</th><th>Lieu</th><th>Photos</th><th>Inscrits</th><th>Statut</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {events.length === 0 && !loading && !loadError && (
              <tr><td colSpan={7} className="admin-table__empty">Aucun événement pour l&apos;instant.</td></tr>
            )}
            {events.map((ev) => (
              <tr key={ev.id} style={{ opacity: ev.isPublished ? 1 : 0.55 }}>
                <td><span className="admin-table__name">{ev.title}</span></td>
                <td style={{ fontSize: 13 }}>{new Date(ev.eventDate).toLocaleDateString("fr-FR")}</td>
                <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{ev.location ?? "—"}</td>
                <td style={{ fontSize: 13 }}>{ev.photos.length}</td>
                <td>
                  <button
                    className="admin-btn"
                    style={{ fontSize: 12 }}
                    onClick={() => openRegistrations(ev)}
                    disabled={ev._count.registrations === 0}
                  >
                    {ev._count.registrations}{ev.capacity !== null ? ` / ${ev.capacity}` : ""} inscrit{ev._count.registrations !== 1 ? "s" : ""}
                  </button>
                </td>
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

      {viewingRegs && (
        <div className="admin-modal-overlay" onClick={() => setViewingRegs(null)}>
          <div className="admin-modal" style={{ maxWidth: 780 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2 className="admin-modal__title" style={{ fontSize: 16 }}>
                Inscrits — {viewingRegs.title}
              </h2>
              <button className="admin-modal__close" onClick={() => setViewingRegs(null)}>✕</button>
            </div>

            {regsLoading ? (
              <p className="admin-loading">Chargement…</p>
            ) : registrations.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Aucun inscrit pour l&apos;instant.</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Nom</th><th>Email</th><th>Téléphone</th><th>Fonction</th><th>Domaine</th>
                      <th>Statut</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((reg) => (
                      <tr key={reg.id}>
                        <td>
                          {reg.fullName}
                          {reg.userId && (
                            <span className="admin-badge admin-badge--role" style={{ marginLeft: 8, fontSize: 10 }}>
                              compte
                            </span>
                          )}
                        </td>
                        <td style={{ fontSize: 13 }}>{reg.email}</td>
                        <td style={{ fontSize: 13 }}>{reg.phone ?? "—"}</td>
                        <td style={{ fontSize: 13 }}>{reg.jobTitle ?? "—"}</td>
                        <td style={{ fontSize: 13 }}>{reg.trainingDomain ?? "—"}</td>
                        <td>
                          <span className={`admin-badge admin-badge--${REG_STATUS_CLS[reg.status]}`}>
                            {REG_STATUS_LABEL[reg.status]}
                          </span>
                        </td>
                        <td>
                          <div className="admin-cell-actions">
                            {reg.status !== "CONFIRMED" && (
                              <button className="admin-btn admin-btn--confirm" onClick={() => confirmRegistration(reg.id)}>
                                Valider
                              </button>
                            )}
                            {reg.status !== "REJECTED" && (
                              <button className="admin-btn admin-btn--cancel" onClick={() => rejectRegistration(reg.id)}>
                                Refuser
                              </button>
                            )}
                            <button className="admin-btn" onClick={() => removeRegistration(reg.id)}>
                              Retirer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
