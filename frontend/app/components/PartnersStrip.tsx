"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Partner {
  id: string;
  name: string;
  description: string | null;
  discountRate: string | null;
  contact: string | null;
}

// Bandeau « Avantages partenaires » affiché sur les pages de formations (tâche 3).
export default function PartnersStrip() {
  const [partners, setPartners] = useState<Partner[]>([]);

  useEffect(() => {
    api.get<Partner[]>("/partners").then(setPartners).catch(() => setPartners([]));
  }, []);

  if (partners.length === 0) return null;

  return (
    <section className="partners-strip">
      <div className="container">
        <span className="section-eyebrow partners-strip__eyebrow">Avantages partenaires</span>
        <h2 className="partners-strip__title">Vos avantages en tant qu&apos;apprenant IN ACADEMY</h2>
        <div className="partners-strip__grid">
          {partners.map((p) => (
            <div className="partners-strip__card" key={p.id}>
              <div className="partners-strip__head">
                <span className="partners-strip__name">{p.name}</span>
                {p.discountRate && <span className="partners-strip__badge">{p.discountRate}</span>}
              </div>
              {p.description && <p className="partners-strip__desc">{p.description}</p>}
              {p.contact && <p className="partners-strip__contact">📍 {p.contact}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
