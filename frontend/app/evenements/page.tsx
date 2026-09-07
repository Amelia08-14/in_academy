"use client";

import { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import { useAuth } from "../hooks/useAuth";
import { fileUrl } from "@/lib/fileUrl";
import { api } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

interface EventPhoto { id: string; photoUrl: string }
interface EventItem {
  id: string;
  title: string;
  eventDate: string;
  location: string | null;
  summary: string | null;
  photos: EventPhoto[];
  isRegistered?: boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function RegisterModal({ event, onClose, onRegistered }: { event: EventItem; onClose: () => void; onRegistered: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      const res = await fetch(`${API}/events/${event.id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone: phone || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        const firstFieldError = data.errors ? Object.values(data.errors).flat()[0] : null;
        setError(data.error ?? (firstFieldError as string) ?? "Erreur lors de l'inscription.");
        return;
      }
      setSuccess(true);
      onRegistered();
    } catch {
      setError("Impossible de joindre le serveur.");
    } finally {
      setPending(false);
    }
  };

  const hero = event.photos[0] ?? null;

  return (
    <div className="event-register-overlay" onClick={onClose}>
      <div className={`event-register-card${hero ? " event-register-card--with-visual" : ""}`} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="event-register-card__close" onClick={onClose} aria-label="Fermer">✕</button>

        {hero && (
          <div className="event-register-card__visual">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fileUrl(hero.photoUrl)} alt="" />
            <div className="event-register-card__scrim" />
            <div className="event-register-card__visual-content">
              <span className="event-register-card__badge">Invitation</span>
              <h3>{event.title}</h3>
              <p>{formatDate(event.eventDate)}{event.location ? ` · ${event.location}` : ""}</p>
            </div>
          </div>
        )}

        <div className="event-register-card__panel">
          {success ? (
            <div className="event-register-card__success">
              <div className="auth-success-icon">✓</div>
              <h3>Inscription confirmée</h3>
              <p>Vous êtes inscrit(e) à « {event.title} ». Un email de confirmation vient de vous être envoyé.</p>
            </div>
          ) : (
            <>
              {!hero && (
                <>
                  <span className="event-register-card__eyebrow">Invitation</span>
                  <h3 className="event-register-card__title">{event.title}</h3>
                  <p className="event-register-card__meta">
                    {formatDate(event.eventDate)}{event.location ? ` · ${event.location}` : ""}
                  </p>
                </>
              )}
              <p className="event-register-card__prompt">Vos coordonnées pour valider votre place :</p>

              {error && <div className="auth-error" style={{ marginBottom: 8 }}>{error}</div>}

              <form onSubmit={submit} className="event-register-card__form">
                <div className="auth-field">
                  <label className="auth-label">Nom complet</label>
                  <input
                    type="text" className="auth-input" required
                    value={fullName} onChange={(e) => setFullName(e.target.value)}
                    placeholder="Votre nom et prénom"
                  />
                </div>
                <div className="auth-field">
                  <label className="auth-label">Email</label>
                  <input
                    type="email" className="auth-input" required
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                  />
                </div>
                <div className="auth-field">
                  <label className="auth-label">Téléphone (facultatif)</label>
                  <input
                    type="tel" className="auth-input"
                    value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="+213 XX XX XX XX"
                  />
                </div>
                <button type="submit" className="btn btn--primary event-register-card__submit" disabled={pending}>
                  {pending ? "Envoi…" : "Confirmer ma place"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EventCard({ event, onRegistered }: { event: EventItem; onRegistered: (eventId: string) => void }) {
  const { isAuthenticated } = useAuth();
  const [registering, setRegistering] = useState(false);
  const [directPending, setDirectPending] = useState(false);
  const [directError, setDirectError] = useState("");
  const isUpcoming = new Date(event.eventDate) >= new Date();
  const hero = event.photos[0] ?? null;
  const extraPhotos = event.photos.slice(1, 4);
  const morePhotosCount = event.photos.length - 1 - extraPhotos.length;

  // Connecté : inscription directe en un clic à partir des données du compte —
  // même logique que l'inscription à une formation, pas de formulaire à remplir.
  const registerDirect = async () => {
    setDirectPending(true);
    setDirectError("");
    try {
      await api.post(`/events/${event.id}/register`, {});
      onRegistered(event.id);
    } catch (err: unknown) {
      setDirectError(err instanceof Error ? err.message : "Erreur lors de l'inscription.");
    } finally {
      setDirectPending(false);
    }
  };

  return (
    <article className="event-card">
      {hero && (
        <div className="event-card__hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fileUrl(hero.photoUrl)} alt={event.title} loading="lazy" />
          <span className={`event-card__status event-card__status--${isUpcoming ? "upcoming" : "past"}`}>
            {isUpcoming ? "À venir" : "Événement passé"}
          </span>
        </div>
      )}

      <div className="event-card__body">
        {!hero && (
          <span className={`event-card__status event-card__status--inline event-card__status--${isUpcoming ? "upcoming" : "past"}`}>
            {isUpcoming ? "À venir" : "Événement passé"}
          </span>
        )}

        <div className="event-card__date-row">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>
          {formatDate(event.eventDate)}
        </div>

        <h3 className="event-card__title">{event.title}</h3>

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

        {isUpcoming && (
          <>
            {directError && <p className="event-card__error">{directError}</p>}
            {isAuthenticated ? (
              <button
                type="button"
                className={`btn ${event.isRegistered ? "btn--outline" : "btn--primary"} event-card__cta`}
                onClick={registerDirect}
                disabled={event.isRegistered || directPending}
              >
                {event.isRegistered ? "✓ Inscrit(e)" : directPending ? "Inscription…" : "S'inscrire"}
              </button>
            ) : (
              <button type="button" className="btn btn--primary event-card__cta" onClick={() => setRegistering(true)}>
                S&apos;inscrire
              </button>
            )}
          </>
        )}
      </div>

      {registering && (
        <RegisterModal
          event={event}
          onClose={() => setRegistering(false)}
          onRegistered={() => onRegistered(event.id)}
        />
      )}
    </article>
  );
}

export default function EvenementsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<EventItem[]>("/events")
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const markRegistered = (eventId: string) => {
    setEvents((evs) => evs.map((ev) => ev.id === eventId ? { ...ev, isRegistered: true } : ev));
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
                <EventCard event={ev} key={ev.id} onRegistered={markRegistered} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
