"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import PageHero from "../../components/PageHero";
import EventRegisterModal from "../../components/EventRegisterModal";
import { useAuth } from "../../hooks/useAuth";
import { fileUrl } from "@/lib/fileUrl";
import { api } from "@/lib/api";
import { type Account, type EventItem, formatEventDate } from "@/lib/events";

export default function EventDetailPage() {
  const params = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    api.get<EventItem>(`/events/${params.slug}`)
      .then(setEvent)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.slug]);

  useEffect(() => {
    if (!isAuthenticated) { setAccount(null); return; }
    api.get<Account>("/auth/me").then(setAccount).catch(() => setAccount(null));
  }, [isAuthenticated]);

  if (loading) {
    return (
      <>
        <Header />
        <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
          Chargement…
        </div>
        <Footer />
      </>
    );
  }

  if (notFound || !event) {
    return (
      <>
        <Header />
        <div className="events-page">
          <div className="container">
            <div className="dashboard-empty">
              <p>Cet événement n&apos;existe pas ou n&apos;est plus disponible.</p>
              <Link href="/evenements" className="btn btn--outline" style={{ marginTop: 16 }}>Retour à Nos Events</Link>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const isUpcoming = new Date(event.eventDate) >= new Date();
  const isFull = event.capacity !== null && event.registeredCount >= event.capacity;
  const hero = event.photos[0] ?? null;

  const markRegistered = () => setEvent((ev) => ev ? { ...ev, myStatus: "PENDING" } : ev);

  return (
    <>
      <Header />

      <PageHero
        title={event.title}
        subtitle={`${formatEventDate(event.eventDate)}${event.location ? ` · ${event.location}` : ""}`}
        image={hero ? fileUrl(hero.photoUrl) : undefined}
      />

      <section className="events-page">
        <div className="container event-detail">
          <Link href="/evenements" className="event-detail__back">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Tous les événements
          </Link>

          <div className="event-detail__layout">
            <div className="event-detail__main">
              <span className={`event-card__status event-card__status--inline event-card__status--${isUpcoming ? "upcoming" : "past"}`}>
                {isUpcoming ? "À venir" : "Événement passé"}
              </span>

              {event.summary && <p className="event-detail__summary">{event.summary}</p>}

              {event.photos.length > 1 && (
                <div className="event-detail__gallery">
                  {event.photos.map((p) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={p.id} src={fileUrl(p.photoUrl)} alt={event.title} loading="lazy" />
                  ))}
                </div>
              )}
            </div>

            <aside className="event-detail__sidebar">
              <div className="event-detail__card">
                <div className="event-detail__card-row">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>
                  {formatEventDate(event.eventDate)}
                </div>
                {event.location && (
                  <div className="event-detail__card-row">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {event.location}
                  </div>
                )}
                {event.capacity !== null && (
                  <div className="event-detail__card-row">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    {event.registeredCount} / {event.capacity} inscrits
                  </div>
                )}

                {isUpcoming && event.myStatus !== "REJECTED" && (
                  <div style={{ marginTop: 16 }}>
                    {event.myStatus === "CONFIRMED" ? (
                      <button type="button" className="btn btn--outline event-card__cta" disabled>✓ Inscription confirmée</button>
                    ) : event.myStatus === "PENDING" ? (
                      <button type="button" className="btn btn--outline event-card__cta" disabled>En attente de validation</button>
                    ) : isFull ? (
                      <button type="button" className="btn btn--outline event-card__cta" disabled>Complet</button>
                    ) : (
                      <button type="button" className="btn btn--primary event-card__cta" onClick={() => setRegistering(true)}>
                        S&apos;inscrire
                      </button>
                    )}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>

      {registering && (
        <EventRegisterModal
          event={event}
          account={account}
          onClose={() => setRegistering(false)}
          onRegistered={() => { markRegistered(); }}
        />
      )}

      <Footer />
    </>
  );
}
