"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import PartnersStrip from "../../components/PartnersStrip";
import DescriptionBlock from "../../components/DescriptionBlock";
import MetierLanding from "../../components/MetierLanding";
import { useAuth } from "../../hooks/useAuth";
import { api } from "@/lib/api";
import { branchImage } from "@/lib/branchImages";
import { fileUrl } from "@/lib/fileUrl";
import { formatDurationDays, formatPrice } from "@/lib/format";
import type { PublicSession as Session } from "@/lib/sessions";

export default function SessionDirectPage() {
  const params = useParams<{ id: string }>();
  const { role, isAuthenticated, ready } = useAuth();
  const [session, setSession] = useState<Session | null | "not-found">(null);
  const [enrollState, setEnrollState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [descLang, setDescLang] = useState<"fr" | "ar" | null>(null);

  useEffect(() => {
    api.get<Session>(`/sessions/${params.id}`)
      .then(setSession)
      .catch(() => setSession("not-found"));
  }, [params.id]);

  const enroll = async () => {
    setEnrollState("sending");
    try {
      await api.post("/enrollments", { sessionId: params.id });
      const updatedSession = await api.get<Session>(`/sessions/${params.id}`);
      setSession(updatedSession);
      setEnrollState("done");
    } catch {
      setEnrollState("error");
    }
  };

  if (session === null) {
    return (
      <>
        <Header />
        <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: "var(--text-muted)" }}>Chargement...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (session === "not-found") {
    return (
      <>
        <Header />
        <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <p style={{ color: "var(--text-muted)" }}>Cette session n&apos;existe pas ou plus.</p>
          <Link href="/branches" className="btn btn--primary">Voir toutes les formations</Link>
        </div>
        <Footer />
      </>
    );
  }

  // Sessions métiers (coiffure, barber, esthétique…) : landing dédiée avec
  // formulaire d'inscription directe, sans compte requis.
  if (session.category.isMetier) return <MetierLanding session={session} />;

  const img = session.coverImageUrl ? fileUrl(session.coverImageUrl) : branchImage(session.category.slug);
  const redirectPath = `/session/${session.id}`;
  const duration = formatDurationDays(session.duration ?? session.formation?.duration);
  const price = formatPrice(session.price ?? session.formation?.price, session.pricePeriod);
  const description = session.description ?? session.formation?.description;
  const descriptionAr = session.descriptionAr ?? session.formation?.descriptionAr ?? null;
  const shownLang = descLang ?? (description ? "fr" : "ar");

  return (
    <>
      <Header />

      <section className="bd-page session-detail">
        <div className="container session-detail__container">
          <Link href={`/branches/${session.category.slug}`} className="bd-back">
            {session.category.name}
          </Link>

          <div className="session-detail__hero">
            <div className="session-detail__hero-media">
              {img && <Image src={img} alt={session.title} fill sizes="(max-width: 900px) 100vw, 980px" />}
            </div>
            <div className="session-detail__hero-scrim" />
            <span className={`session-state session-state--${session.isOpen ? "open" : "full"} session-detail__hero-state`}>
              {session.isOpen ? "En cours" : "Complet"}
            </span>
            <div className="session-detail__hero-content">
              <span className="session-detail__hero-eyebrow">{session.category.name}</span>
              <h1 className="session-detail__hero-title">{session.title}</h1>
              <div className="session-detail__hero-meta">
                <span>{new Date(session.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
                {duration && <span>{duration}</span>}
                {price && <span>{price}</span>}
                {session.location && <span>{session.location}</span>}
              </div>
            </div>
          </div>

          <div className="session-detail__layout">
            <article className="session-detail__content">
              <h2>Programme de la formation</h2>
              {description && descriptionAr && (
                <div className="metier-lang" role="tablist" aria-label="Langue de la description">
                  <button type="button" role="tab" aria-selected={shownLang === "fr"}
                    className={`metier-lang__btn${shownLang === "fr" ? " metier-lang__btn--active" : ""}`}
                    onClick={() => setDescLang("fr")}>
                    Français
                  </button>
                  <button type="button" role="tab" aria-selected={shownLang === "ar"}
                    className={`metier-lang__btn metier-lang__btn--ar${shownLang === "ar" ? " metier-lang__btn--active" : ""}`}
                    onClick={() => setDescLang("ar")}>
                    العربية
                  </button>
                </div>
              )}
              {shownLang === "fr" && description ? (
                <DescriptionBlock text={description} dir="ltr" />
              ) : descriptionAr ? (
                <DescriptionBlock text={descriptionAr} dir="rtl" />
              ) : (
                <p>Les informations détaillées de cette formation seront complétées prochainement.</p>
              )}
            </article>

            <aside className="session-detail__aside">
              <div className="session-detail__summary">
                <div>
                  <span>Date</span>
                  <strong>{new Date(session.startDate).toLocaleDateString("fr-FR")}</strong>
                </div>
                {duration && (
                  <div>
                    <span>Durée</span>
                    <strong>{duration}</strong>
                  </div>
                )}
                {price && (
                  <div>
                    <span>Tarif</span>
                    <strong>{price}</strong>
                  </div>
                )}
                {session.location && (
                  <div>
                    <span>Lieu</span>
                    <strong>{session.location}</strong>
                  </div>
                )}
                <div>
                  <span>Places</span>
                  <strong>{session.isOpen ? `${session.spotsLeft} restante${session.spotsLeft > 1 ? "s" : ""}` : "Session complète"}</strong>
                </div>
              </div>

              {!session.isOpen ? (
                <div className="session-detail__cta-full">
                  <span className="session-state session-state--full session-detail__cta-badge">Complet</span>
                  <p>Cette session n&apos;est plus ouverte aux inscriptions.</p>
                  <Link href={`/branches`} className="btn btn--outline" style={{ width: "100%" }}>
                    Voir les sessions en cours
                  </Link>
                </div>
              ) : !ready ? null : !isAuthenticated ? (
                <div className="catalogue__notice">
                  <span>Créez un compte ou connectez-vous pour vous inscrire directement à cette formation.</span>
                  <div className="catalogue__notice-actions">
                    <Link href={`/connexion?redirect=${encodeURIComponent(redirectPath)}`} className="btn btn--outline">
                      Se connecter
                    </Link>
                    <Link href={`/inscription?redirect=${encodeURIComponent(redirectPath)}`} className="btn btn--primary">
                      Créer un compte
                    </Link>
                  </div>
                </div>
              ) : role === "LEARNER" ? (
                <button
                  type="button"
                  className="btn btn--primary catalogue__quote-btn"
                  style={{ width: "100%" }}
                  disabled={enrollState === "sending" || enrollState === "done"}
                  onClick={enroll}
                >
                  {enrollState === "done" ? "Inscription envoyée ✓"
                    : enrollState === "sending" ? "Envoi…"
                      : enrollState === "error" ? "Réessayer"
                        : `S'inscrire (${session.spotsLeft} place${session.spotsLeft > 1 ? "s" : ""})`}
                </button>
              ) : (
                <div className="catalogue__notice">
                  <span>Cette inscription directe est réservée aux comptes particulier.</span>
                  <div className="catalogue__notice-actions">
                    <Link href={`/branches/${session.category.slug}`} className="btn btn--outline">
                      Voir le domaine
                    </Link>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>

      <PartnersStrip />

      <Footer />
    </>
  );
}
