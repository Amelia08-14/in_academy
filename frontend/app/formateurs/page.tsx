"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";

interface Category { id: string; name: string; slug: string }
interface Formation { id: string; title: string; slug: string; category: Category | null }
interface TrainerFormation { formation: Formation }
interface Trainer {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  speciality: string | null;
  bio: string | null;
  isActive: boolean;
  formations: TrainerFormation[];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// Palette de la charte — une couleur par domaine, attribuée de façon stable (hash du nom).
const DOMAIN_PALETTE: { bg: string; text: string; pill: string; pillText: string }[] = [
  { bg: "linear-gradient(135deg, #0f2340, #1c3a63)", text: "#fff", pill: "rgba(15,35,64,0.10)", pillText: "#0f2340" },
  { bg: "linear-gradient(135deg, #c4922a, #a07520)", text: "#fff", pill: "rgba(196,146,42,0.14)", pillText: "#a07520" },
  { bg: "linear-gradient(135deg, #2e7d84, #1f5f65)", text: "#fff", pill: "rgba(46,125,132,0.14)", pillText: "#1f5f65" },
  { bg: "linear-gradient(135deg, #03469f, #011939)", text: "#fff", pill: "rgba(3,70,159,0.12)", pillText: "#03469f" },
  { bg: "linear-gradient(135deg, #8b5a2b, #6b4420)", text: "#fff", pill: "rgba(139,90,43,0.14)", pillText: "#8b5a2b" },
  { bg: "linear-gradient(135deg, #3d9aa2, #1f5f65)", text: "#fff", pill: "rgba(61,154,162,0.14)", pillText: "#1f5f65" },
];

function domainColor(key: string) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return DOMAIN_PALETTE[hash % DOMAIN_PALETTE.length];
}

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
      (t.speciality ?? "").toLowerCase().includes(q) ||
      (t.formations[0]?.formation.category?.name ?? "").toLowerCase().includes(q)
    );
  });

  // Regroupe les formateurs par domaine (branche de leur formation principale).
  const groups = useMemo(() => {
    const map = new Map<string, { name: string; trainers: Trainer[] }>();
    for (const t of filtered) {
      const domain = t.formations[0]?.formation.category;
      const key = domain?.id ?? "__autres";
      const name = domain?.name ?? "Autres domaines";
      if (!map.has(key)) map.set(key, { name, trainers: [] });
      map.get(key)!.trainers.push(t);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => (a === "__autres" ? 1 : b === "__autres" ? -1 : 0))
      .map(([key, v]) => ({ key, ...v }));
  }, [filtered]);

  return (
    <>
      <Header />

      <PageHero
        title="Nos Formateurs"
        subtitle="Des experts métier et des pédagogues expérimentés pour vous accompagner vers l'excellence professionnelle."
        primaryLabel="Explorer Le Catalogue"
        primaryHref="/branches"
        secondaryLabel="Nous contacter"
        secondaryHref="/contact"
      />

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
                placeholder="Rechercher par nom, spécialité ou domaine…"
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

          {!loading && !error && groups.map((group) => {
            const color = domainColor(group.key);
            return (
              <div className="trainers-domain-group" key={group.key}>
                <div className="trainers-domain-group__head">
                  <span className="trainers-domain-group__dot" style={{ background: color.pillText }} />
                  <h2 className="trainers-domain-group__title">{group.name}</h2>
                  <span className="trainers-domain-group__count">{group.trainers.length}</span>
                </div>

                <div className="trainers-grid">
                  {group.trainers.map((trainer) => (
                    <div key={trainer.id} className="trainer-card">
                      <div className="trainer-card__avatar" style={{ background: color.bg, color: color.text }}>
                        {getInitials(trainer.displayName)}
                      </div>
                      <div className="trainer-card__body">
                        <h3 className="trainer-card__name">{trainer.displayName}</h3>
                        <span
                          className="trainer-card__speciality"
                          style={{ background: color.pill, borderColor: color.pill, color: color.pillText }}
                        >
                          {group.name}
                        </span>
                        {trainer.speciality && trainer.speciality !== group.name && (
                          <p className="trainer-card__bio">{trainer.speciality}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-banner">
        <div className="container">
          <div className="cta-banner__inner">
            <div className="cta-banner__content">
              <h2 className="cta-banner__title">
                Vous êtes formateur ?<br />Rejoignez notre équipe.
              </h2>
              <p className="cta-banner__sub">
                IN ACADEMY recrute des experts métier pour enrichir son catalogue
                de formations certifiantes.
              </p>
            </div>
            <div className="cta-banner__actions">
              <Link href="/devenir-collaborateur" className="btn btn--gold">Devenir collaborateur</Link>
              <Link href="/branches" className="btn btn--outline">Nos formations</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
