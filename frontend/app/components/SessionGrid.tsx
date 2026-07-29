"use client";

import Link from "next/link";
import Image from "next/image";
import { branchImage } from "@/lib/branchImages";
import { fileUrl } from "@/lib/fileUrl";
import { formatDa, formatDurationDays } from "@/lib/format";

export interface Session {
  id: string;
  title: string;
  coverImageUrl: string | null;
  duration: string | null;
  price: number | null;
  startDate: string;
  location: string | null;
  spotsLeft: number;
  maxCapacity: number;
  isOpen: boolean;
  status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  category: { slug: string; name: string; isMetier?: boolean };
}

export default function SessionGrid({ sessions, emptyLabel }: { sessions: Session[]; emptyLabel?: string }) {
  return (
    <section className="branches-listing">
      <div className="container">
        {sessions.length === 0 ? (
          <div className="catalogue__empty">
            <p>{emptyLabel ?? "Aucune session pour le moment."}</p>
            <Link href="/contact" className="btn btn--outline" style={{ marginTop: 16 }}>
              Demander une formation spécifique
            </Link>
          </div>
        ) : (
          <div className="catalogue__grid">
            {sessions.map((s, i) => {
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
                    <span className={`session-date session-date--${i % 4}`}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                      </svg>
                      {new Date(s.startDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                    </span>
                    <div className="catalogue__item-meta">
                      {duration && <span className="catalogue__item-duration">{duration}</span>}
                      {price && <span className="catalogue__item-price">{price}</span>}
                      <span className={`catalogue__item-spots${s.spotsLeft === 0 ? " catalogue__item-spots--full" : ""}`}>
                        {s.spotsLeft}/{s.maxCapacity} place{s.spotsLeft > 1 ? "s" : ""} restante{s.spotsLeft > 1 ? "s" : ""}
                      </span>
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
