"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { useAuth } from "@/app/hooks/useAuth";
import { roleHomeRoute } from "@/lib/auth";
import { api } from "@/lib/api";

interface Company {
  id: string;
  raisonSociale: string;
  nif: string | null;
  rc: string | null;
  address: string | null;
  wilaya: string | null;
  phone: string | null;
}
interface FormationMini { title: string; duration: string | null }
interface QuoteItem { id: string; formation: FormationMini; participants: number; preferredDate: string | null }
interface Quote {
  id: string;
  status: "PENDING" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  message: string | null;
  createdAt: string;
  respondedAt: string | null;
  items: QuoteItem[];
}
interface Employee { id: string; firstName: string; lastName: string; email: string | null }
interface EnrollmentFormation { title: string }
interface EnrollmentSession { formation: EnrollmentFormation }
interface Enrollment {
  id: string;
  type: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  createdAt: string;
  formation: EnrollmentFormation | null;
  session: EnrollmentSession | null;
  employees: Employee[];
}
interface CompanyData { company: Company; quotes: Quote[] }

const QUOTE_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING:  { label: "En attente",   cls: "pending"   },
  SENT:     { label: "Envoyé",       cls: "sent"      },
  ACCEPTED: { label: "Accepté",      cls: "confirmed" },
  REJECTED: { label: "Refusé",       cls: "cancelled" },
  EXPIRED:  { label: "Expiré",       cls: "expired"   },
};

const ENROLL_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: "En attente",  cls: "pending"   },
  CONFIRMED: { label: "Confirmée",   cls: "confirmed" },
  CANCELLED: { label: "Annulée",     cls: "cancelled" },
  COMPLETED: { label: "Terminée",    cls: "completed" },
};

function EspaceEntrepriseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, token, role, logout: clearAuth } = useAuth();
  const [data, setData] = useState<CompanyData | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"devis" | "formations">(
    searchParams.get("tab") === "formations" ? "formations" : "devis"
  );
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [employeeForms, setEmployeeForms] = useState<Record<string, { firstName: string; lastName: string; email: string }>>({});
  const [addingEmployeeId, setAddingEmployeeId] = useState<string | null>(null);

  const loadData = () => {
    if (!token) return;
    const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    return Promise.all([
      fetch(`${BASE}/companies/my-quotes`, { headers }).then((r) => r.json()),
      fetch(`${BASE}/companies/my-enrollments`, { headers }).then((r) => r.json()),
    ])
      .then(([companyData, enrData]) => {
        setData(companyData);
        setEnrollments(Array.isArray(enrData) ? enrData : []);
      })
      .catch(() => setError("Erreur de chargement des données entreprise."));
  };

  useEffect(() => {
    if (!ready) return;

    if (!token) { router.replace("/connexion"); return; }
    if (role && role !== "COMPANY_ADMIN") {
      router.replace(roleHomeRoute(role));
      return;
    }

    loadData()?.finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, token, role, router]);

  const logout = () => {
    clearAuth();
    router.push("/connexion");
  };

  const respondToQuote = async (quoteId: string, accept: boolean) => {
    setRespondingId(quoteId);
    try {
      await api.patch(`/companies/quotes/${quoteId}/respond`, { accept });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la réponse au devis.");
    } finally {
      setRespondingId(null);
    }
  };

  const employeeForm = (enrollmentId: string) =>
    employeeForms[enrollmentId] ?? { firstName: "", lastName: "", email: "" };

  const setEmployeeField = (enrollmentId: string, field: "firstName" | "lastName" | "email", value: string) => {
    setEmployeeForms((v) => ({ ...v, [enrollmentId]: { ...employeeForm(enrollmentId), [field]: value } }));
  };

  const addEmployee = async (enrollmentId: string) => {
    const form = employeeForm(enrollmentId);
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    setAddingEmployeeId(enrollmentId);
    try {
      await api.post(`/companies/enrollments/${enrollmentId}/employees`, {
        firstName: form.firstName, lastName: form.lastName, email: form.email || undefined,
      });
      setEmployeeForms((v) => ({ ...v, [enrollmentId]: { firstName: "", lastName: "", email: "" } }));
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'ajout de l'employé.");
    } finally {
      setAddingEmployeeId(null);
    }
  };

  const removeEmployee = async (enrollmentId: string, employeeId: string) => {
    await api.delete(`/companies/enrollments/${enrollmentId}/employees/${employeeId}`);
    await loadData();
  };

  if (loading) return (
    <>
      <Header />
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--text-muted)" }}>Chargement…</p>
      </div>
    </>
  );

  const company = data?.company;
  const quotes  = data?.quotes ?? [];
  const pendingQuotes = quotes.filter((q) => q.status === "PENDING").length;
  const activeEnroll  = enrollments.filter((e) => e.status === "CONFIRMED").length;

  const getEnrTitle = (e: Enrollment) =>
    e.session?.formation?.title ?? e.formation?.title ?? "—";

  return (
    <>
      <Header />

      <div className="dashboard-page">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <div className="dashboard-profile">
            <div className="dashboard-avatar" style={{ background: "var(--navy)", color: "#fff", fontSize: 20 }}>
              {company?.raisonSociale?.charAt(0) ?? "E"}
            </div>
            <h2 className="dashboard-name">{company?.raisonSociale ?? "Entreprise"}</h2>
            {company?.wilaya && <p className="dashboard-email">{company.wilaya}</p>}
            {company?.phone && <p className="dashboard-email">{company.phone}</p>}
          </div>

          <nav className="dashboard-nav">
            <button
              className={`dashboard-nav__item${activeTab === "devis" ? " dashboard-nav__item--active" : ""}`}
              onClick={() => setActiveTab("devis")}
            >
              <span>◈</span> Devis & Demandes
            </button>
            <button
              className={`dashboard-nav__item${activeTab === "formations" ? " dashboard-nav__item--active" : ""}`}
              onClick={() => setActiveTab("formations")}
            >
              <span>◉</span> Formations programmées
            </button>
            <Link href="/inscription-entreprise" className="dashboard-nav__item">
              <span>+</span> Nouvelle demande
            </Link>
          </nav>

          <button className="dashboard-logout" onClick={logout}>Déconnexion</button>
        </aside>

        {/* Main */}
        <main className="dashboard-main">
          {error && <div className="auth-error">{error}</div>}

          {/* KPIs */}
          <div className="dashboard-kpis">
            <div className="dashboard-kpi">
              <span className="dashboard-kpi__num">{quotes.length}</span>
              <span className="dashboard-kpi__lbl">Devis total</span>
            </div>
            <div className="dashboard-kpi dashboard-kpi--orange">
              <span className="dashboard-kpi__num">{pendingQuotes}</span>
              <span className="dashboard-kpi__lbl">En attente</span>
            </div>
            <div className="dashboard-kpi dashboard-kpi--gold">
              <span className="dashboard-kpi__num">{activeEnroll}</span>
              <span className="dashboard-kpi__lbl">Formations confirmées</span>
            </div>
            <div className="dashboard-kpi dashboard-kpi--muted">
              <span className="dashboard-kpi__num">{enrollments.length}</span>
              <span className="dashboard-kpi__lbl">Inscriptions total</span>
            </div>
          </div>

          {/* Tab: Devis */}
          {activeTab === "devis" && (
            <section className="dashboard-section">
              <h2 className="dashboard-section__title">Mes devis & demandes</h2>
              {quotes.length === 0 ? (
                <div className="dashboard-empty">
                  <p>Aucun devis pour le moment.</p>
                  <Link href="/inscription-entreprise" className="btn btn--primary" style={{ fontSize: 13, marginTop: 16 }}>
                    Faire une demande
                  </Link>
                </div>
              ) : (
                <div className="company-quotes">
                  {quotes.map((q) => {
                    const st = QUOTE_STATUS[q.status];
                    return (
                      <div key={q.id} className="company-quote-card">
                        <div className="company-quote-card__header">
                          <div>
                            <span className="company-quote-card__ref">
                              Demande du {new Date(q.createdAt).toLocaleDateString("fr-DZ")}
                            </span>
                            <span className="company-quote-card__date">
                              {new Date(q.createdAt).toLocaleDateString("fr-DZ", { day: "numeric", month: "long", year: "numeric" })}
                            </span>
                          </div>
                          <span className={`admin-badge admin-badge--${st.cls}`}>{st.label}</span>
                        </div>
                        {q.message && (
                          <p className="company-quote-card__message">&laquo; {q.message} &raquo;</p>
                        )}
                        {q.items.length > 0 && (
                          <ul className="company-quote-card__items">
                            {q.items.map((item) => (
                              <li key={item.id}>
                                <span className="company-quote-item__title">{item.formation.title}</span>
                                {item.formation.duration && (
                                  <span className="company-quote-item__meta"> · {item.formation.duration}</span>
                                )}
                                {item.participants > 1 && (
                                  <span className="company-quote-item__qty"> × {item.participants} participants</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                        {q.status === "SENT" && (
                          <div className="admin-actions" style={{ marginTop: 12 }}>
                            <button
                              className="admin-btn admin-btn--confirm"
                              disabled={respondingId === q.id}
                              onClick={() => respondToQuote(q.id, true)}
                            >
                              ✓ Accepter le devis
                            </button>
                            <button
                              className="admin-btn admin-btn--cancel"
                              disabled={respondingId === q.id}
                              onClick={() => respondToQuote(q.id, false)}
                            >
                              ✕ Refuser
                            </button>
                          </div>
                        )}
                        {q.respondedAt && (
                          <p className="company-quote-card__responded">
                            Réponse le {new Date(q.respondedAt).toLocaleDateString("fr-DZ")}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Tab: Formations */}
          {activeTab === "formations" && (
            <section className="dashboard-section">
              <h2 className="dashboard-section__title">Formations programmées</h2>
              {enrollments.length === 0 ? (
                <div className="dashboard-empty">
                  <p>Aucune formation inscrite pour le moment. Acceptez un devis pour vous inscrire.</p>
                </div>
              ) : (
                <div className="company-enrollments">
                  {enrollments.map((e) => {
                    const st = ENROLL_STATUS[e.status];
                    const form = employeeForm(e.id);
                    return (
                      <div key={e.id} className="company-quote-card">
                        <div className="company-quote-card__header">
                          <div>
                            <span className="company-quote-card__ref">{getEnrTitle(e)}</span>
                            <span className="company-quote-card__date">
                              Inscrit le {new Date(e.createdAt).toLocaleDateString("fr-DZ")}
                            </span>
                          </div>
                          <span className={`admin-badge admin-badge--${st.cls}`}>{st.label}</span>
                        </div>

                        {e.employees.length > 0 && (
                          <ul className="company-employee-list">
                            {e.employees.map((emp) => (
                              <li key={emp.id}>
                                <span>{emp.firstName} {emp.lastName}{emp.email ? ` — ${emp.email}` : ""}</span>
                                <button className="admin-btn admin-btn--cancel" onClick={() => removeEmployee(e.id, emp.id)}>
                                  Retirer
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}

                        <div className="company-employee-form">
                          <input
                            type="text" className="auth-input" placeholder="Prénom"
                            value={form.firstName} onChange={(ev) => setEmployeeField(e.id, "firstName", ev.target.value)}
                          />
                          <input
                            type="text" className="auth-input" placeholder="Nom"
                            value={form.lastName} onChange={(ev) => setEmployeeField(e.id, "lastName", ev.target.value)}
                          />
                          <input
                            type="email" className="auth-input" placeholder="Email (optionnel)"
                            value={form.email} onChange={(ev) => setEmployeeField(e.id, "email", ev.target.value)}
                          />
                          <button
                            className="btn btn--outline" style={{ fontSize: 12 }}
                            disabled={addingEmployeeId === e.id}
                            onClick={() => addEmployee(e.id)}
                          >
                            + Ajouter un employé
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      <Footer />
    </>
  );
}
export default function EspaceEntreprisePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh" }} />}>
      <EspaceEntrepriseContent />
    </Suspense>
  );
}