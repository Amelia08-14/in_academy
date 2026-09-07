"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import EventRegisterModal from "../components/EventRegisterModal";
import { useAuth } from "../hooks/useAuth";
import { fileUrl } from "@/lib/fileUrl";
import { api } from "@/lib/api";
import { type Account, type EventItem, formatEventDate } from "@/lib/events";

function EventCard({ event, account, onRegistered }: { event: EventItem; account: Account | null; onRegistered: (eventId: string) => void }) {
  const [registering, setRegistering] = useState(false);
  const isUpcoming = new Date(event.eventDate) >= new Date();
  const isFull = event.capacity !== null && event.registeredCount >= event.capacity;
  const hero = event.photos[0] ?? null;
  const extraPhotos = event.photos.slice(1, 4);
  const morePhotosCount = event.photos.length - 1 - extraPhotos.length;

  return (
    <article className="event-card">
      {hero && (
        <Link href={`/evenements/${event.slug}`} className="event-card__hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fileUrl(hero.photoUrl)} alt={event.title} loading="lazy" />
          <span className={`event-card__status event-card__status--${isUpcoming ? "upcoming" : "past"}`}>
            {isUpcoming ? "À venir" : "Événement passé"}
          </span>
        </Link>
      )}

      <div className="event-card__body">
        {!hero && (
          <span className={`event-card__status event-card__status--inline event-card__status--${isUpcoming ? "upcoming" : "past"}`}>
            {isUpcoming ? "À venir" : "Événement passé"}
          </span>
        )}

        <div className="event-card__date-row">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>
          {formatEventDate(event.eventDate)}
        </div>

        <h3 className="event-card__title">
          <Link href={`/evenements/${event.slug}`}>{event.title}</Link>
        </h3>

        {event.location && (
          <p className="event-card__location">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {event.location}
          </p>
        )}

        {event.summary && <p className="event-card__summary">{event.summary}</p>}

        {extraPhotos.length > 0 && (
          <div className="event-card__gallery">
            {extraPhotos.map((p, i) => (
              <div className="event-card__gallery-item" key={p.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fileUrl(p.photoUrl)} alt="" loading="lazy" />
                {i === extraPhotos.length - 1 && morePhotosCount > 0 && (
                  <span className="event-card__gallery-more">+{morePhotosCount}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {event.capacity !== null && (
          <p className="event-card__capacity">{event.registeredCount} / {event.capacity} inscrits</p>
        )}

        {isUpcoming && event.myStatus !== "REJECTED" && (
          event.myStatus === "CONFIRMED" ? (
            <button type="button" className="btn btn--outline event-card__cta" disabled>✓ Inscription confirmée</button>
          ) : event.myStatus === "PENDING" ? (
            <button type="button" className="btn btn--outline event-card__cta" disabled>En attente de validation</button>
          ) : isFull ? (
            <button type="button" className="btn btn--outline event-card__cta" disabled>Complet</button>
          ) : (
            <button type="button" className="btn btn--primary event-card__cta" onClick={() => setRegistering(true)}>
              S&apos;inscrire
            </button>
          )
        )}
      </div>

      {registering && (
        <EventRegisterModal
          event={event}
          account={account}
          onClose={() => setRegistering(false)}
          onRegistered={() => onRegistered(event.id)}
        />
      )}
    </article>
  );
}

export default function EvenementsPage() {
  const { isAuthenticated } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<EventItem[]>("/events")
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) { setAccount(null); return; }
    api.get<Account>("/auth/me").then(setAccount).catch(() => setAccount(null));
  }, [isAuthenticated]);

  const markRegistered = (eventId: string) => {
    setEvents((evs) => evs.map((ev) => ev.id === eventId ? { ...ev, myStatus: "PENDING" as const } : ev));
  };

  return (
    <>
      <Header />

      <PageHero
        title="Nos Events"
        subtitle="Journées portes ouvertes, remises de certificats, ateliers métiers… retrouvez les temps forts organisés par IN ACADEMY."
      />

      <section className="events-page">
        <div className="container">
          {loading ? (
            <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "48px 0" }}>Chargement…</p>
          ) : events.length === 0 ? (
            <div className="dashboard-empty">
              <p>Aucun événement publié pour l&apos;instant — revenez bientôt pour découvrir nos prochains rendez-vous.</p>
            </div>
          ) : (
            <div className="events-grid">
              {events.map((ev) => (
                <EventCard event={ev} account={account} key={ev.id} onRegistered={markRegistered} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
