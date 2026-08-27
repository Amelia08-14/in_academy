"use client";

import { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import { fileUrl } from "@/lib/fileUrl";

interface EventPhoto { id: string; photoUrl: string }
interface EventItem {
  id: string;
  title: string;
  eventDate: string;
  location: string | null;
  summary: string | null;
  photos: EventPhoto[];
}

export default function EvenementsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"}/events`)
      .then((r) => r.json())
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

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
                <article className="event-card" key={ev.id}>
                  <div className="event-card__date">
                    <span className="event-card__date-day">
                      {new Date(ev.eventDate).toLocaleDateString("fr-FR", { day: "2-digit" })}
                    </span>
                    <span className="event-card__date-month">
                      {new Date(ev.eventDate).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <div className="event-card__body">
                    <h3 className="event-card__title">{ev.title}</h3>
                    {ev.location && <p className="event-card__location">📍 {ev.location}</p>}
                    {ev.summary && <p className="event-card__summary">{ev.summary}</p>}
                    {ev.photos.length > 0 && (
                      <div className="event-card__photos">
                        {ev.photos.map((p) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={p.id} src={fileUrl(p.photoUrl)} alt={ev.title} loading="lazy" />
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
