"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import PartnersStrip from "../../components/PartnersStrip";
import PageHero from "../../components/PageHero";
import { api } from "@/lib/api";
import { branchImage } from "@/lib/branchImages";

interface Formation { id: string }
interface Category { id: string; slug: string; name: string; description: string | null; formations: Formation[] }

export default function FormationsMetiersPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Onglet Métiers = uniquement les branches métiers (coiffure, esthétique, barber, onglerie…).
    api.get<Category[]>("/categories?metier=true")
      .then(setCategories)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Header />

      <PageHero
        title="Formations Métiers"
        subtitle="Coiffure, esthétique, barber, onglerie… Des branches métiers ouvertes aussi bien aux particuliers qu'aux entreprises."
        primaryLabel="Explorer Le Catalogue"
        primaryHref="#catalogue"
        secondaryLabel="Nous contacter"
        secondaryHref="/contact"
        image="/home_pic/home_pic_1.png"
        imagePosition="center 30%"
      />

      <section className="branches-listing" id="catalogue">
        <div className="container">
          {categories.length === 0 && !loading ? (
            <div className="catalogue__empty">
              <p>Aucune branche métier pour le moment.</p>
              <Link href="/contact" className="btn btn--outline" style={{ marginTop: 16 }}>
                Nous contacter
              </Link>
            </div>
          ) : (
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
                      <span className="bl-card__tag">
                        {cat.formations.length} formation{cat.formations.length > 1 ? "s" : ""}
                      </span>
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
          )}
        </div>
      </section>

      <PartnersStrip />

      <Footer />
    </>
  );
}
