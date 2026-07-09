"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, notFound } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useAuth } from "../../hooks/useAuth";
import { api } from "@/lib/api";
import { branchImage } from "@/lib/branchImages";

interface Formation {
  id: string;
  title: string;
  description: string | null;
  duration: string | null;
  price: number | null;
  isCertifying: boolean;
  coverImageUrl: string | null;
}
interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  formations: Formation[];
}
interface Session {
  id: string;
  title: string;
  duration: string | null;
  startDate: string;
  spotsLeft: number;
  isOpen: boolean;
  coverImageUrl: string | null;
}

const fileUrl = (url: string) => `/api/files/${url.replace("/uploads/", "")}`;

function FormationCards({
  formations,
  fallbackImage,
  renderAction,
}: {
  formations: Formation[];
  fallbackImage: string | null;
  renderAction?: (f: Formation) => ReactNode;
}) {
  return (
    <div className="bd-formations__grid">
      {formations.map((f) => {
        const img = f.coverImageUrl ? fileUrl(f.coverImageUrl) : fallbackImage;
        return (
          <div className="bd-formation-item" key={f.id}>
            <div className="bd-formation-item__media">
              {img ? (
                <Image src={img} alt={f.title} fill sizes="(max-width: 900px) 100vw, 360px" />
              ) : (
                <div className="bd-formation-item__media-placeholder" />
              )}
            </div>
            <div className="bd-formation-item__body">
              <h4 className="bd-formation-item__title">{f.title}</h4>
              {f.description && <p className="bd-formation-item__desc">{f.description}</p>}
              <div className="bd-formation-item__meta">
                {f.duration && <span className="bd-formation-item__duration">{f.duration}</span>}
                {f.isCertifying && <span className="bd-formation-item__badge">Certifiante</span>}
              </div>
              {renderAction && <div className="bd-formation-item__action">{renderAction(f)}</div>}
            </div>
          </div>
        );
      })}
      {formations.length === 0 && (
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Aucune formation publiée pour ce domaine pour le moment.</p>
      )}
    </div>
  );
}

function FormationsForCompany({ formations, fallbackImage }: { formations: Formation[]; fallbackImage: string | null }) {
  const [quoteState, setQuoteState] = useState<Record<string, "idle" | "sending" | "sent" | "error">>({});

  const requestQuote = async (formationId: string) => {
    setQuoteState((s) => ({ ...s, [formationId]: "sending" }));
    try {
      await api.post("/companies/quotes", { formationId, participants: 1 });
      setQuoteState((s) => ({ ...s, [formationId]: "sent" }));
    } catch {
      setQuoteState((s) => ({ ...s, [formationId]: "error" }));
    }
  };

  return (
    <FormationCards
      formations={formations}
      fallbackImage={fallbackImage}
      renderAction={(f) => (
        <button
          type="button"
          className="btn btn--outline catalogue__quote-btn"
          disabled={quoteState[f.id] === "sending" || quoteState[f.id] === "sent"}
          onClick={() => requestQuote(f.id)}
        >
          {quoteState[f.id] === "sent" ? "Devis demandé ✓"
            : quoteState[f.id] === "sending" ? "Envoi…"
            : quoteState[f.id] === "error" ? "Réessayer"
            : "Demander un devis"}
        </button>
      )}
    />
  );
}

function FormationsReadOnly({ formations, fallbackImage }: { formations: Formation[]; fallbackImage: string | null }) {
  return (
    <>
      <div className="catalogue__notice" style={{ marginBottom: 24 }}>
        <span>Créez un compte et connectez-vous pour vous inscrire directement aux formations.</span>
        <div className="catalogue__notice-actions">
          <a href="/connexion" className="btn btn--outline">Se connecter</a>
          <a href="/inscription" className="btn btn--primary">Créer un compte</a>
        </div>
      </div>
      <FormationCards formations={formations} fallbackImage={fallbackImage} />
    </>
  );
}

function SessionsForLearner({ categoryId, fallbackImage }: { categoryId: string; fallbackImage: string | null }) {
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [enrollState, setEnrollState] = useState<Record<string, "idle" | "sending" | "done" | "error">>({});

  useEffect(() => {
    api.get<Session[]>(`/sessions?categoryId=${categoryId}`).then(setSessions).catch(() => setSessions([]));
  }, [categoryId]);

  const enroll = async (sessionId: string) => {
    setEnrollState((s) => ({ ...s, [sessionId]: "sending" }));
    try {
      await api.post("/enrollments", { sessionId });
      setEnrollState((s) => ({ ...s, [sessionId]: "done" }));
    } catch {
      setEnrollState((s) => ({ ...s, [sessionId]: "error" }));
    }
  };

  const open = (sessions ?? []).filter((s) => s.isOpen);

  if (sessions === null) return <p className="admin-loading">Chargement…</p>;

  if (open.length === 0) {
    return (
      <div className="catalogue__empty">
        <p>Aucune session ouverte pour ce domaine pour le moment.</p>
        <a href="/contact" className="btn btn--outline" style={{ marginTop: 16 }}>Demander une formation spécifique</a>
      </div>
    );
  }

  return (
    <div className="catalogue__grid">
      {open.map((s) => {
        const img = s.coverImageUrl ? fileUrl(s.coverImageUrl) : fallbackImage;
        return (
          <div className="catalogue__item" key={s.id}>
            <div className="catalogue__item-media">
              {img ? (
                <Image src={img} alt={s.title} fill sizes="(max-width: 900px) 100vw, 360px" />
              ) : null}
            </div>
            <div className="catalogue__item-body">
              <h3 className="catalogue__item-title">{s.title}</h3>
              <div className="catalogue__item-meta">
                <span className="catalogue__item-duration">
                  {new Date(s.startDate).toLocaleDateString("fr-FR")}
                  {s.duration ? ` · ${s.duration}` : ""}
                </span>
              </div>
              <button
                type="button"
                className="btn btn--primary catalogue__quote-btn"
                disabled={enrollState[s.id] === "sending" || enrollState[s.id] === "done"}
                onClick={() => enroll(s.id)}
              >
                {enrollState[s.id] === "done" ? "Inscription envoyée ✓"
                  : enrollState[s.id] === "sending" ? "Envoi…"
                  : enrollState[s.id] === "error" ? "Réessayer"
                  : `S'inscrire (${s.spotsLeft} place${s.spotsLeft > 1 ? "s" : ""})`}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function DomainDetailPage() {
  const params = useParams<{ slug: string }>();
  const { role } = useAuth();
  const [categories, setCategories] = useState<Category[] | null>(null);

  useEffect(() => {
    api.get<Category[]>("/categories").then(setCategories).catch(() => setCategories([]));
  }, []);

  if (categories === null) {
    return (
      <>
        <Header />
        <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: "var(--text-muted)" }}>Chargement…</p>
        </div>
        <Footer />
      </>
    );
  }

  const domaine = categories.find((c) => c.slug === params.slug);
  if (!domaine) notFound();

  const certifiantesCount = domaine.formations.filter((f) => f.isCertifying).length;
  const isLearner = role === "LEARNER";
  const isCompany = role === "COMPANY_ADMIN";

  return (
    <>
      <Header />

      <section className="bd-hero-banner">
        <div className="bd-hero-banner__topbar" />
        <div className="bd-hero-banner__media">
          {branchImage(domaine.slug) && (
            <Image
              src={branchImage(domaine.slug)!}
              alt={domaine.name}
              fill
              priority
              sizes="100vw"
            />
          )}
          <div className="bd-hero-banner__scrim" />
        </div>
        <div className="container bd-hero-banner__inner">
          <Link href="/branches" className="bd-back bd-back--light">
            ← Toutes les formations
          </Link>
          <h1 className="bd-hero-banner__title">{domaine.name}</h1>
          {domaine.description && <p className="bd-hero-banner__desc">{domaine.description}</p>}
        </div>
      </section>

      <section className="bd-page">
        <div className="container">
          <div className="bd-content">
            <div className="bd-formations">
              <div className="bd-formations__head">
                <div>
                  <h2 className="bd-formations__title">
                    {isLearner ? "Sessions ouvertes du domaine" : "Formations du domaine"}
                  </h2>
                  {!isLearner && (
                    <p className="bd-formations__count">
                      {domaine.formations.length} formation{domaine.formations.length > 1 ? "s" : ""}
                      {certifiantesCount > 0 ? ` · ${certifiantesCount} certifiante${certifiantesCount > 1 ? "s" : ""}` : ""}
                    </p>
                  )}
                </div>
              </div>

              {isLearner ? (
                <SessionsForLearner categoryId={domaine.id} fallbackImage={branchImage(domaine.slug)} />
              ) : isCompany ? (
                <FormationsForCompany formations={domaine.formations} fallbackImage={branchImage(domaine.slug)} />
              ) : (
                <FormationsReadOnly formations={domaine.formations} fallbackImage={branchImage(domaine.slug)} />
              )}

              <div className="bd-formations__cta">
                <p>Vous ne trouvez pas la formation qu&apos;il vous faut ?</p>
                <Link href="/contact" className="btn btn--primary">
                  Demander une formation spécifique
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
