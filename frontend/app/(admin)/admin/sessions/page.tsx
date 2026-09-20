"use client";

import { useEffect, useState } from "react";
import { adminApi as api } from "@/lib/adminApi";
import FileUpload from "@/app/components/FileUpload";
import { formatDa } from "@/lib/format";
import { fileUrl } from "@/lib/fileUrl";

interface Category { id: string; name: string; isMetier?: boolean }
type Tab = "particulier" | "metier";
interface Session {
  id: string;
  title: string;
  description: string | null;
  descriptionAr: string | null;
  coverImageUrl: string | null;
  duration: string | null;
  price: number | null;
  pricePeriod: "TOTAL" | "MONTH";
  categoryId: string;
  category: Category;
  startDate: string;
  endDate: string | null;
  location: string | null;
  minCapacity: number;
  maxCapacity: number;
  status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  _count: { enrollments: number };
  registrationCounts: { confirmed: number; pending: number; total: number };
}

type RegistrationStatus = "PENDING" | "CONFIRMED" | "REJECTED";
interface SessionRegistration {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  educationLevel: string;
  userId: string | null;
  status: RegistrationStatus;
  createdAt: string;
}
const REG_LABEL: Record<RegistrationStatus, string> = { PENDING: "En attente", CONFIRMED: "Confirmée", REJECTED: "Refusée" };
const REG_CLS: Record<RegistrationStatus, string> = { PENDING: "pending", CONFIRMED: "confirmed", REJECTED: "cancelled" };

interface EditState {
  id: string | null;
  title: string;
  description: string;
  descriptionAr: string;
  coverImageUrl: string | null;
  duration: string;
  price: number | null;
  pricePeriod: "TOTAL" | "MONTH";
  categoryId: string;
  startDate: string;
  originalStartDate: string;
  enrollmentsCount: number;
  location: string;
  minCapacity: number;
  maxCapacity: number;
  status: Session["status"];
}

const EMPTY: EditState = {
  id: null,
  title: "",
  description: "",
  descriptionAr: "",
  coverImageUrl: null,
  duration: "",
  price: null,
  pricePeriod: "TOTAL",
  categoryId: "",
  startDate: "",
  originalStartDate: "",
  enrollmentsCount: 0,
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

interface Material { id: string; title: string; fileUrl: string; createdAt: string }

function SessionMaterials({ sessionId }: { sessionId: string }) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [uploadKey, setUploadKey] = useState(0);

  const load = () => {
    setLoading(true);
    api.get<Material[]>(`/admin/sessions/${sessionId}/materials`)
      .then(setMaterials)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void Promise.resolve().then(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const add = async () => {
    if (!title.trim() || !pendingUrl) return;
    setAdding(true);
    setError("");
    try {
      await api.post(`/admin/sessions/${sessionId}/materials`, { title: title.trim(), fileUrl: pendingUrl });
      setTitle("");
      setPendingUrl(null);
      setUploadKey((k) => k + 1);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setAdding(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Retirer ce support de cours ?")) return;
    await api.delete(`/admin/materials/${id}`);
    load();
  };

  return (
    <div className="auth-field">
      <label className="auth-label">Supports de cours (visibles par les inscrits confirmés)</label>

      {loading ? (
        <p className="admin-loading">Chargement…</p>
      ) : materials.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>Aucun support ajouté pour l&apos;instant.</p>
      ) : (
        <ul className="session-materials-list">
          {materials.map((m) => (
            <li key={m.id} className="session-materials-list__item">
              <a href={fileUrl(m.fileUrl)} target="_blank" rel="noopener noreferrer">
                {m.title}
              </a>
              <button type="button" className="admin-btn admin-btn--cancel" onClick={() => remove(m.id)}>
                Retirer
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <div className="auth-error">{error}</div>}

      <div className="session-materials-add">
        <input
          type="text" className="auth-input" placeholder="Titre du support (ex : Support PDF - Jour 1)"
          value={title} onChange={(e) => setTitle(e.target.value)}
        />
        <FileUpload
          key={uploadKey}
          label="Fichier"
          accept=".pdf,.doc,.docx"
          hint="PDF ou Word — max 15 Mo"
          onUploaded={(url) => setPendingUrl(url)}
          tokenStorageKey="admin_token"
        />
        <button
          type="button" className="btn btn--outline"
          disabled={!title.trim() || !pendingUrl || adding}
          onClick={add}
        >
          {adding ? "Ajout…" : "+ Ajouter le support"}
        </button>
      </div>
    </div>
  );
}

function SessionRegistrationsModal({
  session, onClose, onChanged,
}: { session: Session; onClose: () => void; onChanged: () => void }) {
  const [regs, setRegs] = useState<SessionRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    api.get<SessionRegistration[]>(`/admin/sessions/${session.id}/registrations`)
      .then(setRegs)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Erreur de chargement."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void Promise.resolve().then(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id]);

  const act = async (id: string, action: "confirm" | "reject" | "delete") => {
    if (action === "delete" && !window.confirm("Retirer définitivement cette inscription ?")) return;
    setError("");
    try {
      if (action === "delete") await api.delete(`/admin/sessions/registrations/${id}`);
      else await api.patch(`/admin/sessions/registrations/${id}/${action}`);
      load();
      onChanged();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" style={{ maxWidth: 1100, width: "95vw" }} onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal__header">
          <h2 className="admin-modal__title" style={{ fontSize: 16 }}>Inscrits (inscription directe) — {session.title}</h2>
          <button className="admin-modal__close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {loading ? (
          <p className="admin-loading">Chargement…</p>
        ) : regs.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Aucune inscription directe pour l&apos;instant.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nom</th><th>Prénom</th><th>Email</th><th>Téléphone</th><th>Niveau d&apos;étude</th>
                  <th>Reçue le</th><th>Statut</th><th></th>
                </tr>
              </thead>
              <tbody>
                {regs.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {r.lastName}
                      {r.userId && (
                        <span className="admin-badge admin-badge--role" style={{ marginLeft: 8, fontSize: 10 }}>compte</span>
                      )}
                    </td>
                    <td>{r.firstName}</td>
                    <td style={{ fontSize: 13 }}>{r.email}</td>
                    <td style={{ fontSize: 13, whiteSpace: "nowrap" }}>{r.phone}</td>
                    <td style={{ fontSize: 13 }}>{r.educationLevel}</td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{new Date(r.createdAt).toLocaleDateString("fr-FR")}</td>
                    <td><span className={`admin-badge admin-badge--${REG_CLS[r.status]}`}>{REG_LABEL[r.status]}</span></td>
                    <td>
                      <div className="admin-cell-actions">
                        {r.status !== "CONFIRMED" && (
                          <button className="admin-btn admin-btn--confirm" onClick={() => act(r.id, "confirm")}>Valider</button>
                        )}
                        {r.status !== "REJECTED" && (
                          <button className="admin-btn admin-btn--cancel" onClick={() => act(r.id, "reject")}>Refuser</button>
                        )}
                        <button className="admin-btn" onClick={() => act(r.id, "delete")}>Retirer</button>
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
  );
}

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("particulier");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [materialsSession, setMaterialsSession] = useState<Session | null>(null);
  const [registrationsSession, setRegistrationsSession] = useState<Session | null>(null);

  const copyLink = async (id: string) => {
    const url = `${window.location.origin}/session/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId((v) => (v === id ? null : v)), 2000);
    } catch {
      window.prompt("Copiez ce lien :", url);
    }
  };

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get<Session[]>("/admin/sessions"),
      api.get<Category[]>("/admin/categories"),
    ])
      .then(([s, c]) => { setSessions(s); setCategories(c); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void Promise.resolve().then(load);
  }, []);

  const tabCats = categories.filter((c) => (tab === "metier" ? c.isMetier : !c.isMetier));

  const filtered = sessions.filter((s) => {
    const sessionIsMetier = !!s.category.isMetier;
    if (tab === "metier" ? !sessionIsMetier : sessionIsMetier) return false;
    return (
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.category.name.toLowerCase().includes(search.toLowerCase())
    );
  });

  const openCreate = () => {
    setEditing({ ...EMPTY, categoryId: tabCats[0]?.id ?? "" });
    setSaveError("");
  };

  const openEdit = (s: Session) => {
    setEditing({
      id: s.id,
      title: s.title,
      description: s.description ?? "",
      descriptionAr: s.descriptionAr ?? "",
      coverImageUrl: s.coverImageUrl,
      duration: s.duration ?? "",
      price: s.price,
      pricePeriod: s.pricePeriod ?? "TOTAL",
      categoryId: s.categoryId,
      startDate: s.startDate.slice(0, 10),
      originalStartDate: s.startDate.slice(0, 10),
      enrollmentsCount: s._count.enrollments,
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
        descriptionAr: editing.descriptionAr || null,
        coverImageUrl: editing.coverImageUrl,
        duration: editing.duration || null,
        price: editing.price,
        pricePeriod: editing.pricePeriod,
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

  const remove = async (s: Session) => {
    const n = s._count.enrollments;
    const warn = n > 0
      ? `Cette session a ${n} inscrit${n > 1 ? "s" : ""}. Les supprimer aussi ? Cette action est irréversible.`
      : "Supprimer définitivement cette session ?";
    if (!window.confirm(warn)) return;
    try {
      await api.delete(`/admin/sessions/${s.id}`);
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur lors de la suppression");
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div className="admin-page__heading">
          <h1 className="admin-page__title">{tab === "metier" ? "Sessions métiers" : "Sessions particulier"}</h1>
          <p className="admin-page__subtitle">Planifiez les dates, capacités et supports de formation.</p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span className="admin-kpi admin-kpi--inline">{filtered.length} sessions</span>
          <button className="btn btn--primary" onClick={openCreate} disabled={tabCats.length === 0}>
            {tab === "metier" ? "+ Nouvelle session métier" : "+ Nouvelle session"}
          </button>
        </div>
      </div>

      <div className="admin-tabs" role="tablist">
        <button
          role="tab"
          className={`admin-tab ${tab === "particulier" ? "admin-tab--active" : ""}`}
          onClick={() => setTab("particulier")}
        >
          Particulier
        </button>
        <button
          role="tab"
          className={`admin-tab ${tab === "metier" ? "admin-tab--active" : ""}`}
          onClick={() => setTab("metier")}
        >
          Métiers
        </button>
      </div>

      {tab === "metier" && tabCats.length === 0 && (
        <p className="admin-loading">
          Aucune catégorie métier configurée (coiffure, esthétique, barber, onglerie…).
          Contactez l&apos;administrateur technique pour en ajouter.
        </p>
      )}

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

            {editing.id && (
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
                  padding: "10px 14px", borderRadius: 8, background: "var(--cream)",
                  border: "1px solid var(--border-light)", fontSize: 12, color: "var(--text-muted)",
                }}
              >
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  Lien de la page d&apos;inscription : /session/{editing.id}
                </span>
                <button type="button" className="admin-btn" onClick={() => copyLink(editing.id as string)}>
                  {copiedId === editing.id ? "Copié ✓" : "Copier"}
                </button>
              </div>
            )}

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
                  <label className="auth-label">{tab === "metier" ? "Catégorie métier" : "Branche"}</label>
                  <select
                    className="auth-input" required
                    value={editing.categoryId}
                    onChange={(e) => setEditing((v) => v ? { ...v, categoryId: e.target.value } : v)}
                  >
                    <option value="" disabled>Choisir…</option>
                    {tabCats.map((c) => (
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
                    placeholder="Ex : 8 (jours) ou 3 mois"
                  />
                </div>
              </div>

              <div className="auth-row">
                <div className="auth-field">
                  <label className="auth-label">Tarif (DA)</label>
                  <input
                    type="number" className="auth-input" min={0}
                    value={editing.price ?? ""}
                    onChange={(e) => setEditing((v) => v ? { ...v, price: e.target.value ? Number(e.target.value) : null } : v)}
                    placeholder="Ex : 45000"
                  />
                </div>
                <div className="auth-field">
                  <label className="auth-label">Le tarif est</label>
                  <select
                    className="auth-input"
                    value={editing.pricePeriod}
                    onChange={(e) => setEditing((v) => v ? { ...v, pricePeriod: e.target.value as "TOTAL" | "MONTH" } : v)}
                  >
                    <option value="TOTAL">Le prix total de la formation</option>
                    <option value="MONTH">Un prix par mois (ex : 35 000 DA / mois)</option>
                  </select>
                </div>
              </div>

              {editing.id && editing.enrollmentsCount > 0 && editing.startDate !== editing.originalStartDate && (
                <div className="admin-inline-warning">
                  ⚠ Cette session compte {editing.enrollmentsCount} inscrit{editing.enrollmentsCount > 1 ? "s" : ""}.
                  Changer sa date déplacera <strong>tous ces inscrits</strong> sous la nouvelle date.
                  Pour une nouvelle date distincte, créez plutôt une <strong>nouvelle session</strong>.
                </div>
              )}

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
                <label className="auth-label">Description (français)</label>
                <textarea
                  className="auth-input" rows={8}
                  value={editing.description}
                  onChange={(e) => setEditing((v) => v ? { ...v, description: e.target.value } : v)}
                  placeholder={"Une ligne courte = sous-titre · « ● élément » ou « - élément » = puce · une ligne vide sépare les blocs"}
                />
              </div>
              <div className="auth-field">
                <label className="auth-label">الوصف بالعربية (description arabe — affichée automatiquement en RTL)</label>
                <textarea
                  className="auth-input" rows={8} dir="rtl" lang="ar"
                  style={{ fontFamily: "var(--font-arabic), var(--font-body)", textAlign: "right" }}
                  value={editing.descriptionAr}
                  onChange={(e) => setEditing((v) => v ? { ...v, descriptionAr: e.target.value } : v)}
                  placeholder="اكتب الوصف بالعربية هنا…"
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

              {editing.id && <SessionMaterials sessionId={editing.id} />}

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

      {registrationsSession && (
        <SessionRegistrationsModal
          session={registrationsSession}
          onClose={() => setRegistrationsSession(null)}
          onChanged={load}
        />
      )}

      {materialsSession && (
        <div className="admin-modal-overlay" onClick={() => setMaterialsSession(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2 className="admin-modal__title" style={{ fontSize: 16 }}>
                Supports de cours — {materialsSession.title}
              </h2>
              <button className="admin-modal__close" onClick={() => setMaterialsSession(null)}>✕</button>
            </div>

            <SessionMaterials sessionId={materialsSession.id} />

            <div className="auth-form-actions">
              <button type="button" className="btn btn--outline" onClick={() => setMaterialsSession(null)}>
                Fermer
              </button>
            </div>
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
              <th>Tarif</th>
              <th>Inscrits</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && !loading && (
              <tr>
                <td colSpan={8} className="admin-table__empty">Aucune session trouvée</td>
              </tr>
            )}
            {filtered.map((s) => (
              <tr key={s.id}>
                <td><span className="admin-table__name">{s.title}</span></td>
                <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.category.name}</td>
                <td style={{ fontSize: 13 }}>{new Date(s.startDate).toLocaleDateString("fr-FR")}</td>
                <td style={{ fontSize: 13 }}>{s.duration ?? <span style={{ color: "var(--border)" }}>—</span>}</td>
                <td style={{ fontSize: 13 }}>{formatDa(s.price) ?? <span style={{ color: "var(--border)" }}>—</span>}</td>
                <td style={{ fontSize: 13 }}>
                  {s._count.enrollments + s.registrationCounts.confirmed} / {s.maxCapacity}
                  {s.registrationCounts.pending > 0 && (
                    <span className="admin-badge admin-badge--pending" style={{ marginLeft: 8, fontSize: 10 }}>
                      {s.registrationCounts.pending} en attente
                    </span>
                  )}
                </td>
                <td>
                  <span className={`admin-badge admin-badge--${s.status === "CANCELLED" ? "cancelled" : s.status === "COMPLETED" ? "cancelled" : "confirmed"}`}>
                    {STATUS_LABELS[s.status]}
                  </span>
                </td>
                <td>
                  <div className="admin-cell-actions">
                    <button className="admin-btn" onClick={() => openEdit(s)}>Modifier</button>
                    <button className="admin-btn" onClick={() => setRegistrationsSession(s)}>
                      Inscrits{s.registrationCounts.total > 0 ? ` (${s.registrationCounts.total})` : ""}
                    </button>
                    <button className="admin-btn" onClick={() => setMaterialsSession(s)}>Supports de cours</button>
                    <button className="admin-btn" onClick={() => copyLink(s.id)} title="Copier le lien d'inscription directe">
                      {copiedId === s.id ? "Copié ✓" : "Copier le lien"}
                    </button>
                    <button className="admin-btn admin-btn--cancel" onClick={() => remove(s)}>Supprimer</button>
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
