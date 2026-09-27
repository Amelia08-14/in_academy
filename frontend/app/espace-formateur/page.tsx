"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import FileUpload from "@/app/components/FileUpload";
import { useAuth } from "@/app/hooks/useAuth";
import { roleHomeRoute } from "@/lib/auth";
import { fileUrl } from "@/lib/fileUrl";
import { api } from "@/lib/api";

interface TrainerMe {
  trainer: { displayName: string; speciality: string | null; phone: string | null } | null;
  user: { email: string };
}
interface TrainerSession {
  id: string;
  title: string;
  startDate: string;
  endDate: string | null;
  location: string | null;
  status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  category: { name: string };
  formation: { title: string } | null;
  _count: { enrollments: number; materials: number };
}
interface Material { id: string; title: string; fileUrl: string; createdAt: string }

const STATUS_LABELS: Record<TrainerSession["status"], string> = {
  SCHEDULED: "Programmée",
  ONGOING: "En cours",
  COMPLETED: "Clôturée",
  CANCELLED: "Annulée",
};
const STATUS_CLS: Record<TrainerSession["status"], string> = {
  SCHEDULED: "confirmed",
  ONGOING: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

function TrainerSessionMaterials({ sessionId }: { sessionId: string }) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [uploadKey, setUploadKey] = useState(0);

  const load = () => {
    setLoading(true);
    api.get<Material[]>(`/trainer-space/sessions/${sessionId}/materials`)
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
      await api.post(`/trainer-space/sessions/${sessionId}/materials`, { title: title.trim(), fileUrl: pendingUrl });
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
    await api.delete(`/trainer-space/materials/${id}`);
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

export default function EspaceFormateurPage() {
  const router = useRouter();
  const { ready, token, role, logout: clearAuth } = useAuth();
  const [me, setMe] = useState<TrainerMe | null>(null);
  const [sessions, setSessions] = useState<TrainerSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openSessionId, setOpenSessionId] = useState<string | null>(null);

  const loadData = () => {
    if (!token) return;
    return Promise.all([
      api.get<TrainerMe>("/trainer-space/me"),
      api.get<TrainerSession[]>("/trainer-space/sessions"),
    ])
      .then(([meData, sessionsData]) => {
        setMe(meData);
        setSessions(Array.isArray(sessionsData) ? sessionsData : []);
      })
      .catch(() => setError("Erreur de chargement de votre espace formateur."));
  };

  useEffect(() => {
    if (!ready) return;
    if (!token) { router.replace("/connexion"); return; }
    if (role && role !== "TRAINER") { router.replace(roleHomeRoute(role)); return; }

    loadData()?.finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, token, role, router]);

  const logout = () => {
    clearAuth();
    router.push("/connexion");
  };

  if (loading) return (
    <>
      <Header />
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--text-muted)" }}>Chargement…</p>
      </div>
    </>
  );

  const trainer = me?.trainer;
  const activeSessions = sessions.filter((s) => s.status === "SCHEDULED" || s.status === "ONGOING").length;

  return (
    <>
      <Header />

      <div className="dashboard-page">
        <aside className="dashboard-sidebar">
          <div className="dashboard-profile">
            <div className="dashboard-avatar" style={{ background: "var(--navy)", color: "#fff", fontSize: 20 }}>
              {trainer?.displayName?.charAt(0) ?? "F"}
            </div>
            <h2 className="dashboard-name">{trainer?.displayName ?? "Formateur"}</h2>
            {trainer?.speciality && <p className="dashboard-email">{trainer.speciality}</p>}
            <p className="dashboard-email">{me?.user.email}</p>
          </div>

          <nav className="dashboard-nav">
            <span className="dashboard-nav__item dashboard-nav__item--active">
              <span>◉</span> Mes sessions
            </span>
          </nav>

          <button className="dashboard-logout" onClick={logout}>Déconnexion</button>
        </aside>

        <main className="dashboard-main">
          {error && <div className="auth-error">{error}</div>}

          {!trainer && !error && (
            <div className="dashboard-empty">
              <p>Votre compte n&apos;est pas encore rattaché à une fiche formateur. Contactez l&apos;administration.</p>
            </div>
          )}

          <div className="dashboard-kpis">
            <div className="dashboard-kpi">
              <span className="dashboard-kpi__num">{sessions.length}</span>
              <span className="dashboard-kpi__lbl">Sessions assignées</span>
            </div>
            <div className="dashboard-kpi dashboard-kpi--gold">
              <span className="dashboard-kpi__num">{activeSessions}</span>
              <span className="dashboard-kpi__lbl">En cours / à venir</span>
            </div>
            <div className="dashboard-kpi dashboard-kpi--muted">
              <span className="dashboard-kpi__num">{sessions.reduce((sum, s) => sum + s._count.enrollments, 0)}</span>
              <span className="dashboard-kpi__lbl">Apprenants inscrits</span>
            </div>
          </div>

          <section className="dashboard-section">
            <h2 className="dashboard-section__title">Mes sessions</h2>

            {sessions.length === 0 ? (
              <div className="dashboard-empty">
                <p>Aucune session ne vous est assignée pour l&apos;instant.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {sessions.map((s) => {
                  const isOpen = openSessionId === s.id;
                  return (
                    <div key={s.id} className="admin-session-group" style={{ padding: 18 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                        <div>
                          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--navy)", marginBottom: 4 }}>{s.title}</h3>
                          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                            {s.category.name}
                            {s.formation && ` · ${s.formation.title}`}
                            {" · "}{new Date(s.startDate).toLocaleDateString("fr-FR")}
                            {s.location && ` · ${s.location}`}
                          </p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span className={`admin-badge admin-badge--${STATUS_CLS[s.status]}`}>{STATUS_LABELS[s.status]}</span>
                          <span className="admin-kpi admin-kpi--inline">{s._count.enrollments} inscrit{s._count.enrollments !== 1 ? "s" : ""}</span>
                          <span className="admin-kpi admin-kpi--inline">{s._count.materials} support{s._count.materials !== 1 ? "s" : ""}</span>
                          <button className="admin-btn" onClick={() => setOpenSessionId(isOpen ? null : s.id)}>
                            {isOpen ? "Fermer" : "Gérer les supports"}
                          </button>
                        </div>
                      </div>

                      {isOpen && (
                        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--beige-dark)" }}>
                          <TrainerSessionMaterials sessionId={s.id} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>

      <Footer />
    </>
  );
}
