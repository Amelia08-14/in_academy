"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "../hooks/useAuth";
import { api } from "@/lib/api";
import { branchImage } from "@/lib/branchImages";
import { fileUrl } from "@/lib/fileUrl";
import { formatDa, formatDurationDays } from "@/lib/format";

interface Formation { id: string; title: string; isCertifying: boolean }
interface Category { id: string; slug: string; name: string; description: string | null; formations: Formation[] }
interface Session {
  id: string;
  title: string;
  coverImageUrl: string | null;
  duration: string | null;
  price: number | null;
  startDate: string;
  location: string | null;
  spotsLeft: number;
  isOpen: boolean;
  status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  category: { slug: string; name: string };
}

function DomainGrid({ categories }: { categories: Category[] }) {
  return (
    <section className="branches-listing">
      <div className="container">
        <div className="branches-listing__grid">
          {categories.map((cat, i) => (
            <Link
              href={`/branches/${cat.slug}`}
              className="bl-card"
              key={cat.id}
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              {branchImage(cat.slug) ? (
                <Image
                  src={branchImage(cat.slug)!}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 900px) 100vw, 33vw"
                  className="bl-card__img"
                />
              ) : (
                <div className="bl-card__gradient" />
              )}
              <div className="bl-card__overlay" />
              <div className="bl-card__content">
                <div className="bl-card__top">
                  <span className="bl-card__num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="bl-card__tag">{cat.formations.length} formation{cat.formations.length > 1 ? "s" : ""}</span>
                </div>
                <div className="bl-card__bottom">
                  <h3 className="bl-card__title">{cat.name}</h3>
                  {cat.description && <p className="bl-card__desc">{cat.description}</p>}
                  <div className="bl-card__footer">
                    <span className="bl-card__formations">Voir le programme</span>
                    <span className="bl-card__arrow">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function SessionGrid({ sessions }: { sessions: Session[] }) {
  return (
    <section className="branches-listing">
      <div className="container">
        {sessions.length === 0 ? (
          <div className="catalogue__empty">
            <p>Aucune session pour le moment.</p>
            <Link href="/contact" className="btn btn--outline" style={{ marginTop: 16 }}>
              Demander une formation spécifique
            </Link>
          </div>
        ) : (
          <div className="catalogue__grid">
            {sessions.map((s) => {
              const img = s.coverImageUrl ? fileUrl(s.coverImageUrl) : branchImage(s.category.slug);
              const duration = formatDurationDays(s.duration);
              const price = formatDa(s.price);

              return (
                <Link href={`/session/${s.id}`} className="catalogue__item catalogue__item--link" key={s.id}>
                  <div className="catalogue__item-media">
                    {img && <Image src={img} alt={s.title} fill sizes="(max-width: 900px) 100vw, 360px" />}
                    <span className={`session-state session-state--${s.isOpen ? "open" : "full"}`}>
                      {s.isOpen ? "En cours" : "Complet"}
                    </span>
                  </div>
                  <div className="catalogue__item-body">
                    <span className="catalogue__item-badge">{s.category.name}</span>
                    <h3 className="catalogue__item-title">{s.title}</h3>
                    <div className="catalogue__item-meta">
                      <span className="catalogue__item-duration">
                        {new Date(s.startDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                      </span>
                      {duration && <span className="catalogue__item-duration">{duration}</span>}
                      {price && <span className="catalogue__item-price">{price}</span>}
                    </div>
                    <div className="bd-formation-item__action">
                      <span className="btn btn--primary">Voir les détails</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default function BranchesPage() {
  const { role } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Category[]>("/categories"),
      api.get<Session[]>("/sessions"),
    ])
      .then(([c, s]) => {
        setCategories(c);
        // On garde les sessions complètes/terminées (affichées "Complet"),
        // on retire seulement les annulées. Les ouvertes d'abord.
        const visible = s
          .filter((session) => session.status !== "CANCELLED")
          .sort((a, b) => Number(b.isOpen) - Number(a.isOpen));
        setSessions(visible);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalFormations = categories.reduce((n, c) => n + c.formations.length, 0);
  const totalOpenSessions = sessions.filter((s) => s.isOpen).length;
  const pctCertifying = totalFormations > 0
    ? Math.round(100 * categories.reduce((n, c) => n + c.formations.filter((f) => f.isCertifying).length, 0) / totalFormations)
    : 100;
  const showDomains = role === "COMPANY_ADMIN";

  return (
    <>
      <Header />

      <section className="branches-page-hero">
        <div className="branches-page-hero__topbar" />
        <div className="branches-page-hero__mosaic" aria-hidden="true">
          {categories.slice(0, 12).map((c) => {
            const img = branchImage(c.slug);
            return img ? (
              <div className="branches-page-hero__tile" key={c.id}>
                <Image src={img} alt="" fill sizes="16vw" />
              </div>
            ) : (
              <div className="branches-page-hero__tile" key={c.id} />
            );
          })}
        </div>
        <div className="branches-page-hero__bg" />
        <div className="container branches-page-hero__inner">
          <span className="section-eyebrow branches-page-hero__eyebrow">
            {showDomains ? "Domaines de formation" : "Sessions ouvertes"}
          </span>
          <h1 className="branches-page-hero__title">Nos Formations</h1>
          <p className="branches-page-hero__sub">
            {showDomains
              ? `${categories.length || "12"} domaines de compétences stratégiques pour construire vos parcours d'entreprise.`
              : "Sessions de formation avec durée, tarif et détails pratiques — inscrivez-vous aux sessions en cours."}
          </p>
          <div className="branches-page-hero__actions">
            <a href="#catalogue" className="btn btn--primary">Explorer le catalogue</a>
            <Link href="/contact" className="btn btn--outline">Nous contacter</Link>
          </div>
          <div className="branches-page-hero__stats">
            <div className="branches-page-hero__stat">
              <span className="branches-page-hero__stat-num">{loading ? "-" : categories.length}</span>
              <span className="branches-page-hero__stat-lbl">Domaines</span>
            </div>
            <div className="branches-page-hero__stat-sep" />
            <div className="branches-page-hero__stat">
              <span className="branches-page-hero__stat-num">{loading ? "-" : showDomains ? totalFormations : totalOpenSessions}</span>
              <span className="branches-page-hero__stat-lbl">{showDomains ? "Formations" : "Sessions ouvertes"}</span>
            </div>
            <div className="branches-page-hero__stat-sep" />
            <div className="branches-page-hero__stat">
              <span className="branches-page-hero__stat-num">{loading ? "-" : `${pctCertifying}%`}</span>
              <span className="branches-page-hero__stat-lbl">Certifiantes</span>
            </div>
          </div>
        </div>
      </section>

      <div id="catalogue">
        {showDomains ? <DomainGrid categories={categories} /> : <SessionGrid sessions={sessions} />}
      </div>

      <Footer />
    </>
  );
}
