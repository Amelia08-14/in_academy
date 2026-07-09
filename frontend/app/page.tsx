"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { api } from "@/lib/api";
import { branchImage } from "@/lib/branchImages";

const stripItems = [
  "Transport & Logistique", "Commerce & Ventes", "HSE & Sécurité", "Finance & Comptabilité",
  "Achats & International", "IT & Digital", "RH & Management", "Juridique & Conformité",
  "Maritime & Import-Export", "Qualité & Production", "Langues", "Audit",
];

const missionPoints = [
  {
    text: "Développer des compétences concrètes, directement mobilisables",
    icon: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
  },
  {
    text: "Intégrer des méthodes pédagogiques actives et actuelles",
    icon: "M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z",
  },
  {
    text: "Offrir un accompagnement personnalisé à chaque étape",
    icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  },
  {
    text: "Valoriser les acquis par des certifications reconnues",
    icon: "M12 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM8.5 13.5 7 22l5-3 5 3-1.5-8.5",
  },
  {
    text: "Soutenir la performance des entreprises et l'évolution des carrières",
    icon: "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6",
  },
  {
    text: "Concevoir des formations sur mesure, alignées sur les besoins métiers",
    icon: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
  },
];

interface Formation { id: string }
interface Category { id: string; slug: string; name: string; formations: Formation[] }
interface BranchItem { num: string; name: string; tag: string; slug: string; href: string }

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpoint]);
  return isMobile;
}

// Position/rotation/arc target for a card at `offset` steps from the centered card.
function slotStyle(offset: number, compact: boolean) {
  const abs = Math.abs(offset);
  const dir = Math.sign(offset);
  const x = dir * (compact ? [0, 118, 172] : [0, 265, 400])[abs];
  const y = (compact ? [0, 16, 32] : [0, 32, 64])[abs];
  const rotate = dir * [0, 4, 8][abs];
  const scale = [1, 0.88, 0.78][abs];
  const opacity = [1, 0.9, 0.7][abs];
  const zIndex = 10 - abs;
  return { x, y, rotate, scale, opacity, zIndex };
}

interface FanCardProps {
  branch: BranchItem;
  offset: number;
  onSelect: () => void;
  compact: boolean;
}

function FanCard({ branch, offset, onSelect, compact }: FanCardProps) {
  const isCenter = offset === 0;
  const style = slotStyle(offset, compact);
  const img = branchImage(branch.slug);

  return (
    <motion.div
      className={`branches-fan__card${compact ? " branches-fan__card--compact" : ""}${isCenter ? " branches-fan__card--center" : ""}`}
      initial={{ x: style.x + (offset > 0 ? 60 : offset < 0 ? -60 : 0), y: style.y, opacity: 0, scale: style.scale * 0.9, rotate: style.rotate }}
      animate={{ x: style.x, y: style.y, rotate: style.rotate, scale: style.scale, opacity: style.opacity, zIndex: style.zIndex }}
      exit={{ x: style.x + (offset > 0 ? 80 : -80), opacity: 0, scale: style.scale * 0.85 }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      whileTap={{ scale: style.scale * 0.96 }}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-label={branch.name}
    >
      {img ? (
        <Image src={img} alt={branch.name} fill sizes="320px" className="branches-fan__img" />
      ) : (
        <div className={`branches-fan__gradient branches-fan__gradient--${offset < 0 ? -offset % 4 : offset % 4}`} />
      )}
    </motion.div>
  );
}

function BranchesFan({ branches }: { branches: BranchItem[] }) {
  const router = useRouter();
  const [centerIdx, setCenterIdx] = useState(0);
  const compact = useIsMobile(640);
  const count = branches.length;
  const wrap = (n: number) => ((n % count) + count) % count;

  // Live drag position drives a subtle tilt, like a swiped card (Pinterest/Tinder style).
  const dragX = useMotionValue(0);
  const dragRotate = useTransform(dragX, [-160, 160], [-6, 6]);

  const shift = (delta: number) => setCenterIdx((v) => wrap(v + delta));

  const handleSelect = (offset: number) => {
    if (offset === 0) {
      router.push(branches[centerIdx].href);
    } else {
      shift(offset);
    }
  };

  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -70) shift(1);
    else if (info.offset.x > 70) shift(-1);
  };

  const visibleOffsets = [-2, -1, 0, 1, 2];
  const center = branches[centerIdx];

  return (
    <div className="branches-fan-wrap">
      <div className="branches-fan__caption">
        <AnimatePresence mode="wait">
          <motion.div
            key={center?.slug}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <h3 className="branches-fan__caption-title">{center?.name}</h3>
            <span className="branches-fan__caption-sub">{center?.tag}</span>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className={`branches-fan${compact ? " branches-fan--compact" : ""}`}>
        <motion.div
          className="branches-fan__track"
          drag="x"
          style={{ x: dragX, rotate: dragRotate }}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.5}
          onDragEnd={handleDragEnd}
        >
          <AnimatePresence initial={false}>
            {visibleOffsets.map((offset) => {
              const idx = wrap(centerIdx + offset);
              return (
                <FanCard
                  key={idx}
                  branch={branches[idx]}
                  offset={offset}
                  onSelect={() => handleSelect(offset)}
                  compact={compact}
                />
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="branches-fan__nav-row">
        <button
          type="button"
          className="branches-fan__nav branches-fan__nav--prev"
          aria-label="Domaine précédent"
          onClick={() => shift(-1)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button
          type="button"
          className="branches-fan__nav branches-fan__nav--next"
          aria-label="Domaine suivant"
          onClick={() => shift(1)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function HeroSlider() {
  const [slide, setSlide] = useState(0);
  const total = 2;

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % total), 8000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="hero-slider" id="accueil">
      <AnimatePresence mode="wait">
        {slide === 0 ? (
          <motion.div
            key="slide-excellence"
            className="hero-slide"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="hero-slide__text">
              <span className="hero-slide__eyebrow">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Agréé par l&apos;état
              </span>

              <h1 className="hero-slide__title">
                Là où l&apos;expertise
                <em>construit l&apos;excellence</em>
              </h1>

              <p className="hero-slide__subtitle">
                Centre de formation professionnelle certifiante dédié à l&apos;excellence.
                Nous formons les talents de demain à travers des programmes
                rigoureux et adaptés aux exigences du marché.
              </p>

              <div className="hero-slide__actions">
                <Link href="/branches" className="btn btn--primary">Découvrir les formations</Link>
                <Link href="/connexion" className="btn btn--outline">Se connecter</Link>
              </div>
            </div>

            <div className="hero-slide__media">
              <div className="hero-slide__blob" aria-hidden="true" />
              <div className="hero-slide__img-frame frame-marks">
                <Image src="/banner2.png" alt="Formation IN Academy" fill style={{ objectFit: "contain" }} priority />
                <span className="frame-marks__mark frame-marks__mark--tr" aria-hidden="true" />
                <span className="frame-marks__mark frame-marks__mark--bl" aria-hidden="true" />
                <span className="frame-marks__mark frame-marks__mark--br" aria-hidden="true" />
              </div>
              <span className="hero-slide__tag">excellence &amp; rigueur</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="slide-choice"
            className="hero-slide"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="hero-slide__text">
              <span className="hero-slide__eyebrow">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                Commencer maintenant
              </span>

              <h1 className="hero-slide__title">
                Vous êtes particulier
                <em>ou entreprise ?</em>
              </h1>

              <p className="hero-slide__subtitle">
                Choisissez votre profil pour accéder directement au formulaire
                d&apos;inscription qui vous correspond.
              </p>

              <div className="hero-slide__choices">
                <Link href="/inscription" className="hero-slide__choice">
                  <span className="hero-slide__choice-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <span className="hero-slide__choice-text">
                    <strong>Particulier</strong>
                    <span>Je m&apos;inscris à une formation</span>
                  </span>
                  <span className="hero-slide__choice-arrow">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </Link>

                <Link href="/inscription-entreprise" className="hero-slide__choice">
                  <span className="hero-slide__choice-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 21h18M6 21V7l6-4 6 4v14M9 9h1M9 13h1M9 17h1M14 9h1M14 13h1M14 17h1" />
                    </svg>
                  </span>
                  <span className="hero-slide__choice-text">
                    <strong>Entreprise</strong>
                    <span>Je forme mes équipes / je demande un devis</span>
                  </span>
                  <span className="hero-slide__choice-arrow">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </Link>
              </div>
            </div>

            <div className="hero-slide__media">
              <div className="hero-slide__blob" aria-hidden="true" />
              <div className="hero-slide__img-frame frame-marks">
                <Image src="/banner.png" alt="IN Academy" fill style={{ objectFit: "contain" }} priority />
                <span className="frame-marks__mark frame-marks__mark--tr" aria-hidden="true" />
                <span className="frame-marks__mark frame-marks__mark--bl" aria-hidden="true" />
                <span className="frame-marks__mark frame-marks__mark--br" aria-hidden="true" />
              </div>
              <span className="hero-slide__tag">à vous de choisir</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="hero-slider__nav">
        <div className="hero-slider__dots">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              type="button"
              className={`hero-slider__dot${i === slide ? " hero-slider__dot--active" : ""}`}
              onClick={() => setSlide(i)}
              aria-label={`Aller au slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api.get<Category[]>("/categories").then(setCategories).catch(() => setCategories([]));
  }, []);

  const allBranches: BranchItem[] = categories.map((c, i) => ({
    num: String(i + 1).padStart(2, "0"),
    name: c.name,
    tag: `${c.formations.length} formation${c.formations.length > 1 ? "s" : ""}`,
    slug: c.slug,
    href: `/branches/${c.slug}`,
  }));

  const totalFormations = categories.reduce((n, c) => n + c.formations.length, 0);

  return (
    <>
      <Header />

      {/* ===== HERO SLIDER ===== */}
      <HeroSlider />

      {/* Scrolling branches strip */}
      <div className="hero__strip" aria-hidden="true">
        <div className="hero__strip-track">
          {[...stripItems, ...stripItems].map((name, i) => (
            <span key={i} className="hero__strip-item">
              <span className="hero__strip-sep">✦</span>
              {name}
            </span>
          ))}
        </div>
      </div>

      {/* ===== MISSION ===== */}
      <section className="mission" id="mission">
        <div className="container">
          <div className="mission__layout">
            {/* Left: photo + floating caption */}
            <motion.div
              className="mission__media"
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7 }}
            >
              <div className="mission__media-frame">
                <Image src="/mission.jpg" alt="Équipe IN ACADEMY" fill style={{ objectFit: "cover" }} />
                <div className="mission__media-overlay" />
              </div>
              <div className="mission__media-caption">
                <span className="mission__media-caption-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                  </svg>
                </span>
                <div>
                  <p>Un accompagnement de terrain, ancré dans les réalités du marché algérien.</p>
                </div>
              </div>
            </motion.div>

            {/* Right: mission content */}
            <div className="mission__content">
              <span className="section-eyebrow">Ce que nous faisons</span>
              <h2 className="section-title">Notre Mission</h2>
              <span className="section-divider" />
              <p className="mission__description">
                Offrir un accompagnement personnalisé et des formations alignées
                sur les besoins métiers réels du marché algérien et international.
              </p>

              <motion.div
                className="mission__points-grid"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
              >
                {missionPoints.map((point, i) => (
                  <motion.div
                    key={i}
                    variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}
                    className="mission__point-card"
                  >
                    <span className="mission__point-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d={point.icon} />
                      </svg>
                    </span>
                    <p className="mission__point-text">{point.text}</p>
                  </motion.div>
                ))}
              </motion.div>

              <div className="mission__cta-strip">
                <span className="mission__cta-check">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
                <p>Rejoignez une formation certifiante et donnez un nouvel élan à votre carrière.</p>
                <Link href="/branches" className="btn btn--gold">Découvrir nos formations</Link>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="mission__stats">
            <div className="mission__stat">
              <span className="mission__stat-num">12+</span>
              <span className="mission__stat-lbl">Domaines de formation</span>
            </div>
            <div className="mission__stat">
              <span className="mission__stat-num">{totalFormations || "60"}+</span>
              <span className="mission__stat-lbl">Formations au catalogue</span>
            </div>
            <div className="mission__stat">
              <span className="mission__stat-num">100%</span>
              <span className="mission__stat-lbl">Formations certifiantes</span>
            </div>
            <div className="mission__stat">
              <span className="mission__stat-num">1–7</span>
              <span className="mission__stat-lbl">Jours par session</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== BRANCHES ===== */}
      <section className="branches" id="branches">
        <div className="container">
          <div className="branches__header">
            <div>
              <span className="section-eyebrow">Domaines de formation</span>
              <h2 className="branches__title">Nos Formations</h2>
            </div>
            <Link href="/branches" className="branches__link">
              Voir tout le catalogue
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {allBranches.length === 0 ? (
            <div className="branches-list__skeleton" aria-hidden="true">
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className="branches-list__skeleton-row" />
              ))}
            </div>
          ) : (
            <BranchesFan branches={allBranches} />
          )}
        </div>
      </section>

      {/* ===== CTA BANNER ===== */}
      <section className="cta-banner">
        <div className="container">
          <motion.div
            className="cta-banner__inner"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
          >
            <div className="cta-banner__content">
              <span className="section-eyebrow cta-banner__eyebrow">Commencez maintenant</span>
              <h2 className="cta-banner__title">
                Prêt à propulser<br />votre carrière ?
              </h2>
              <p className="cta-banner__sub">
                Rejoignez nos programmes certifiants et donnez une nouvelle
                dimension à vos compétences professionnelles.
              </p>
            </div>
            <div className="cta-banner__actions">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link href="/inscription" className="btn btn--gold">S&apos;inscrire maintenant</Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link href="/branches" className="btn btn--outline">Voir les formations</Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </>
  );
}
