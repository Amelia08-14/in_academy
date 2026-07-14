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
import { fileUrl } from "@/lib/fileUrl";
import { formatDa, formatDurationDays } from "@/lib/format";

interface Session {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  duration: string | null;
  price: number | null;
  startDate: string;
  location: string | null;
  spotsLeft: number;
  maxCapacity: number;
  isOpen: boolean;
  category: { slug: string; name: string };
  formation: { title: string; description: string | null; duration: string | null; price: number | null } | null;
}

function DescriptionBlock({ text }: { text: string }) {
  const blocks = text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="session-detail__description">
      {blocks.map((block, index) => {
        const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
        const isList = lines.every((line) => /^[-*•]\s+/.test(line));

        if (isList) {
          return (
            <ul key={index}>
              {lines.map((line) => (
                <li key={line}>{line.replace(/^[-*•]\s+/, "")}</li>
              ))}
            </ul>
          );
        }

        if (lines.length > 1) {
          const [first, ...rest] = lines;
          const restIsList = rest.every((line) => /^[-*•]\s+/.test(line));

          if (first && restIsList) {
            return (
              <div className="session-detail__description-group" key={index}>
                <h3>{first}</h3>
                <ul>
                  {rest.map((line) => (
                    <li key={line}>{line.replace(/^[-*•]\s+/, "")}</li>
                  ))}
                </ul>
              </div>
            );
          }
        }

        return <p key={index}>{lines.join(" ")}</p>;
      })}
    </div>
  );
}

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

  const img = session.coverImageUrl ? fileUrl(session.coverImageUrl) : branchImage(session.category.slug);
  const redirectPath = `/session/${session.id}`;
  const duration = formatDurationDays(session.duration ?? session.formation?.duration);
  const price = formatDa(session.price ?? session.formation?.price);
  const description = session.description ?? session.formation?.description;

  return (
    <>
      <Header />

      <section className="bd-page session-detail">
        <div className="container session-detail__container">
          <Link href={`/branches/${session.category.slug}`} className="bd-back">
            {session.category.name}
          </Link>

          <div className="bd-hero-banner session-detail__hero">
            <div className="bd-hero-banner__media session-detail__hero-media">
              {img && <Image src={img} alt={session.title} fill sizes="(max-width: 900px) 100vw, 980px" />}
            </div>
          </div>
          <h1 className="session-detail__sr-only">{session.title}</h1>

          <div className="session-detail__layout">
            <article className="session-detail__content">
              <h2>Programme de la formation</h2>
              {description ? (
                <DescriptionBlock text={description} />
              ) : (
                <p>Les informations detaillees de cette formation seront completees prochainement.</p>
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
                    <span>Duree</span>
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
                  <span>Capacite</span>
                  <strong>{session.spotsLeft}/{session.maxCapacity} restantes sur la totalite de la capacite</strong>
                </div>
              </div>

              {!session.isOpen ? (
                <div className="catalogue__empty">
                  <p>Cette session n&apos;est plus ouverte aux inscriptions.</p>
                  <Link href={`/branches/${session.category.slug}`} className="btn btn--outline" style={{ marginTop: 16 }}>
                    Voir les autres sessions du domaine
                  </Link>
                </div>
              ) : !ready ? null : !isAuthenticated ? (
                <div className="catalogue__notice">
                  <span>Creez un compte ou connectez-vous pour vous inscrire directement a cette formation.</span>
                  <div className="catalogue__notice-actions">
                    <Link href={`/connexion?redirect=${encodeURIComponent(redirectPath)}`} className="btn btn--outline">
                      Se connecter
                    </Link>
                    <Link href={`/inscription?redirect=${encodeURIComponent(redirectPath)}`} className="btn btn--primary">
                      Creer un compte
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
                  {enrollState === "done" ? "Inscription envoyee"
                    : enrollState === "sending" ? "Envoi..."
                      : enrollState === "error" ? "Reessayer"
                        : `S'inscrire (${session.spotsLeft} place${session.spotsLeft > 1 ? "s" : ""})`}
                </button>
              ) : (
                <div className="catalogue__notice">
                  <span>Cette inscription directe est reservee aux comptes particulier.</span>
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

      <Footer />
    </>
  );
}
