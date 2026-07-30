"use client";

import { useEffect, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import PartnersStrip from "../../components/PartnersStrip";
import PageHero from "../../components/PageHero";
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

  return (
    <>
      <Header />

      <PageHero
        title="Formation"
        subtitle="Sessions ouvertes aux inscriptions, avec durée, tarif et détails pratiques avant validation."
        primaryLabel="Explorer Le Catalogue"
        primaryHref="#catalogue"
        secondaryLabel="Nous contacter"
        secondaryHref="/contact"
      />

      <div id="catalogue">
        <SessionGrid sessions={sessions} emptyLabel="Aucune session particulier pour le moment." />
      </div>

      {!loading && <PartnersStrip />}

      <Footer />
    </>
  );
}
