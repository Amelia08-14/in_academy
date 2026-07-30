"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "../components/Header";
import Footer from "../components/Footer";
import PartnersStrip from "../components/PartnersStrip";
import PageHero from "../components/PageHero";
import { api } from "@/lib/api";
import { branchImage } from "@/lib/branchImages";

interface Formation { id: string; title: string; isCertifying: boolean }
interface Category { id: string; slug: string; name: string; description: string | null; formations: Formation[] }

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

export default function BranchesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // "Formations Entreprises" = les branches (catégories hors métiers).
    api.get<Category[]>("/categories?metier=false")
      .then(setCategories)
      .finally(() => setLoading(false));
  }, []);

  const totalFormations = categories.reduce((n, c) => n + c.formations.length, 0);
  const pctCertifying = totalFormations > 0
    ? Math.round(100 * categories.reduce((n, c) => n + c.formations.filter((f) => f.isCertifying).length, 0) / totalFormations)
    : 100;

  return (
    <>
      <Header />

      <PageHero
        title="Nos Formations"
        subtitle={`${categories.length || "12"} domaines de compétences stratégiques pour construire les parcours de vos équipes.`}
        primaryLabel="Explorer Le Catalogue"
        primaryHref="#catalogue"
        secondaryLabel="Nous contacter"
        secondaryHref="/contact"
      />

      <div className="branches-stats-strip">
        <div className="container branches-stats-strip__inner">
          <div className="branches-stats-strip__stat">
            <span className="branches-stats-strip__num">{loading ? "-" : categories.length}</span>
            <span className="branches-stats-strip__lbl">Domaines</span>
          </div>
          <div className="branches-stats-strip__sep" />
          <div className="branches-stats-strip__stat">
            <span className="branches-stats-strip__num">{loading ? "-" : totalFormations}</span>
            <span className="branches-stats-strip__lbl">Formations</span>
          </div>
          <div className="branches-stats-strip__sep" />
          <div className="branches-stats-strip__stat">
            <span className="branches-stats-strip__num">{loading ? "-" : `${pctCertifying}%`}</span>
            <span className="branches-stats-strip__lbl">Certifiantes</span>
          </div>
        </div>
      </div>

      <div id="catalogue">
        <DomainGrid categories={categories} />
      </div>

      <PartnersStrip />

      <Footer />
    </>
  );
}
