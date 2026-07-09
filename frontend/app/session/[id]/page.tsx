"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useAuth } from "../../hooks/useAuth";
import { api } from "@/lib/api";
import { branchImage } from "@/lib/branchImages";

interface Session {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  duration: string | null;
  startDate: string;
  location: string | null;
  spotsLeft: number;
  isOpen: boolean;
  category: { slug: string; name: string };
}

const fileUrl = (url: string) => `/api/files/${url.replace("/uploads/", "")}`;

export default function SessionDirectPage() {
  const params = useParams<{ id: string }>();
  const { role, isAuthenticated, ready } = useAuth();
  const [session, setSession] = useState<Session | null | "not-found">(null);
  const [enrollState, setEnrollState] = useState<"idle" | "sending" | "done" | "error">("idle");

  useEffect(() => {
    api.get<Session>(`/sessions/${params.id}`)
      .then(setSession)
      .catch(() => setSession("not-found"));
  }, [params.id]);

  const enroll = async () => {
    setEnrollState("sending");
    try {
      await api.post("/enrollments", { sessionId: params.id });
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
          <p style={{ color: "var(--text-muted)" }}>Chargement…</p>
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

  const img = session.coverImageUrl ? fileUrl(session.coverImageUrl) : branchImage(session.category.slug);
  const redirectPath = `/session/${session.id}`;

  return (
    <>
      <Header />

      <section className="bd-page">
        <div className="container" style={{ maxWidth: 760 }}>
          <Link href={`/branches/${session.category.slug}`} className="bd-back">
            ← {session.category.name}
          </Link>

          <div className="bd-hero-banner" style={{ minHeight: 320, borderRadius: 20, marginBottom: 40 }}>
            <div className="bd-hero-banner__media" style={{ borderRadius: 20, overflow: "hidden" }}>
              {img && <Image src={img} alt={session.title} fill sizes="760px" />}
              <div className="bd-hero-banner__scrim" />
            </div>
            <div className="bd-hero-banner__inner" style={{ paddingTop: 48, paddingBottom: 32 }}>
              <span className="section-eyebrow" style={{ color: "var(--gold-light)" }}>
                {session.category.name}
              </span>
              <h1 className="bd-hero-banner__title" style={{ fontSize: "clamp(28px, 4vw, 42px)" }}>
                {session.title}
              </h1>
              <p className="bd-hero-banner__desc">
                {new Date(session.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                {session.duration ? ` · ${session.duration}` : ""}
                {session.location ? ` · ${session.location}` : ""}
              </p>
            </div>
          </div>

          {session.description && (
            <p style={{ color: "var(--text-body)", lineHeight: 1.75, marginBottom: 32 }}>
              {session.description}
            </p>
          )}

          {!session.isOpen ? (
            <div className="catalogue__empty">
              <p>Cette session n&apos;est plus ouverte aux inscriptions.</p>
              <Link href={`/branches/${session.category.slug}`} className="btn btn--outline" style={{ marginTop: 16 }}>
                Voir les autres sessions du domaine
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
        </div>
      </section>

      <Footer />
    </>
  );
}
