"use client";

import { useEffect, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import PartnersStrip from "../../components/PartnersStrip";
import SessionGrid, { type Session } from "../../components/SessionGrid";
import { api } from "@/lib/api";

interface Category { id: string; slug: string; name: string; description: string | null }

export default function FormationsMetiersPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Session[]>("/sessions?metier=true"),
      api.get<Category[]>("/categories?metier=true"),
    ])
      .then(([s, c]) => {
        const visible = s
          .filter((session) => session.status !== "CANCELLED")
          .sort((a, b) => Number(b.isOpen) - Number(a.isOpen));
        setSessions(visible);
        setCategories(c);
      })
      .finally(() => setLoading(false));
  }, []);

  const openCount = sessions.filter((s) => s.isOpen).length;

  return (
    <>
      <Header />

      <section className="formations-hero formations-hero--metiers">
        <div className="formations-hero__bg" />
        <div className="container formations-hero__inner">
          <span className="section-eyebrow formations-hero__eyebrow">Formations Métiers</span>
          <h1 className="formations-hero__title">Métiers de la beauté &amp; du bien-être</h1>
          <p className="formations-hero__sub">
            Coiffure, esthétique, barber, onglerie… Des formations métiers ouvertes aussi bien aux
            <strong> particuliers</strong> qu&apos;aux <strong>entreprises</strong>.
          </p>

          {categories.length > 0 && (
            <div className="formations-hero__chips">
              {categories.map((c) => (
                <span key={c.id} className="formations-hero__chip">{c.name}</span>
              ))}
            </div>
          )}

          <div className="formations-hero__stats">
            <div className="formations-hero__stat">
              <span className="formations-hero__stat-num">{loading ? "-" : categories.length}</span>
              <span className="formations-hero__stat-lbl">Métiers</span>
            </div>
            <div className="formations-hero__stat-sep" />
            <div className="formations-hero__stat">
              <span className="formations-hero__stat-num">{loading ? "-" : sessions.length}</span>
              <span className="formations-hero__stat-lbl">Sessions</span>
            </div>
            <div className="formations-hero__stat-sep" />
            <div className="formations-hero__stat">
              <span className="formations-hero__stat-num">{loading ? "-" : openCount}</span>
              <span className="formations-hero__stat-lbl">Ouvertes</span>
            </div>
          </div>
        </div>
      </section>

      <SessionGrid sessions={sessions} emptyLabel="Aucune session métier pour le moment." />

      <PartnersStrip />

      <Footer />
    </>
  );
}
