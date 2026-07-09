"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

interface Trainer {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  speciality: string | null;
  bio: string | null;
  isActive: boolean;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

const AVATAR_COLORS = [
  ["#c4922a", "#f0deb0"],
  ["#0f2340", "#d4e4f7"],
  ["#2e7d84", "#c8edf0"],
  ["#a07520", "#f5e6c5"],
  ["#1f5f65", "#d0ecee"],
  ["#8b5a2b", "#f0ddd0"],
];

export default function FormateursPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/trainers`)
      .then((r) => r.json())
      .then((data) => {
        setTrainers(Array.isArray(data) ? data : data.data ?? []);
      })
      .catch(() => setError("Impossible de charger les formateurs."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = trainers.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.displayName.toLowerCase().includes(q) ||
      (t.speciality ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <>
      <Header />

      {/* Page Hero */}
      <section className="page-hero">
        <div className="container">
          <span className="page-hero__label">Notre équipe pédagogique</span>
          <h1 className="page-hero__title">Nos Formateurs</h1>
          <p className="page-hero__subtitle">
            Des experts métier et des pédagogues expérimentés pour vous
            accompagner vers l&apos;excellence professionnelle.
          </p>
        </div>
      </section>

      {/* Trainers grid */}
      <section className="trainers-section">
        <div className="container">
          {/* Search bar */}
          <div className="trainers-search">
            <div className="trainers-search__wrap">
              <svg className="trainers-search__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Rechercher par nom ou spécialité…"
                className="trainers-search__input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {!loading && (
              <span className="trainers-count">
                {filtered.length} formateur{filtered.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {loading && (
            <div className="trainers-loading">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="trainer-card trainer-card--skeleton" />
              ))}
            </div>
          )}

          {error && <p className="trainers-error">{error}</p>}

          {!loading && !error && filtered.length === 0 && (
            <div className="trainers-empty">
              <p>Aucun formateur trouvé pour &laquo;&nbsp;{search}&nbsp;&raquo;.</p>
            </div>
          )}

          <div className="trainers-grid">
            {filtered.map((trainer, i) => {
              const [bg, text] = AVATAR_COLORS[i % AVATAR_COLORS.length];
              return (
                <div key={trainer.id} className="trainer-card">
                  <div className="trainer-card__avatar" style={{ background: bg, color: text }}>
                    {getInitials(trainer.displayName)}
                  </div>
                  <div className="trainer-card__body">
                    <h3 className="trainer-card__name">{trainer.displayName}</h3>
                    {trainer.speciality && (
                      <span className="trainer-card__speciality">{trainer.speciality}</span>
                    )}
                    {trainer.bio && (
                      <p className="trainer-card__bio">{trainer.bio}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-banner">
        <div className="container">
          <div className="cta-banner__inner">
            <div className="cta-banner__content">
              <span className="section-eyebrow cta-banner__eyebrow">Rejoignez-nous</span>
              <h2 className="cta-banner__title">
                Vous êtes formateur ?<br />Rejoignez notre équipe.
              </h2>
              <p className="cta-banner__sub">
                IN ACADEMY recrute des experts métier pour enrichir son catalogue
                de formations certifiantes.
              </p>
            </div>
            <div className="cta-banner__actions">
              <Link href="/inscription" className="btn btn--gold">S&apos;inscrire</Link>
              <Link href="/branches" className="btn btn--outline">Nos formations</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
