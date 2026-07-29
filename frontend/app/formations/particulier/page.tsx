"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import PartnersStrip from "../../components/PartnersStrip";
import SessionGrid, { type Session } from "../../components/SessionGrid";
import { api } from "@/lib/api";

export default function FormationsParticulierPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Session[]>("/sessions?metier=false")
      .then((s) => {
        const visible = s
          .filter((session) => session.status !== "CANCELLED")
          .sort((a, b) => Number(b.isOpen) - Number(a.isOpen));
        setSessions(visible);
      })
      .finally(() => setLoading(false));
  }, []);

  const openCount = sessions.filter((s) => s.isOpen).length;

  return (
    <>
      <Header />

      <section className="formations-hero">
        <div className="formations-hero__bg" />
        <div className="container formations-hero__inner">
          <span className="section-eyebrow formations-hero__eyebrow">Formations Particulier</span>
          <h1 className="formations-hero__title">Sessions pour les particuliers</h1>
          <p className="formations-hero__sub">
            Des sessions ouvertes aux inscriptions individuelles : durée, tarif et détails pratiques.
            Choisissez votre session et inscrivez-vous directement.
          </p>
          <div className="formations-hero__stats">
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

      <SessionGrid sessions={sessions} emptyLabel="Aucune session particulier pour le moment." />

      <PartnersStrip />

      <Footer />
    </>
  );
}
