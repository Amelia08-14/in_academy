"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Header from "./components/Header";
import Footer from "./components/Footer";

import adminGestionImg from "./images/Techniques administratives et gestio.png";
import itNumeriqueImg from "./images/Informatique – Numérique – Télécom .png";
import chimieQhseImg from "./images/Chimie industrielle – Plasturgie – QHSE.png";
import electriciteImg from "./images/Électricité – Électronique – Énergétique .png";
import hotellerieImg from "./images/Hôtellerie – Restauration – Tourisme.png";
import artGraphiquesImg from "./images/Art & Industries graphiques.png";
import anglaisImg from "./images/Technique-expression-Anglais.png";
import agroImg from "./images/Industries agroalimentaires.png";
import audiovisuelImg from "./images/Techniques audiovisuelles .png";
import bannerImg from "./images/banner.png";

const stripItems = [
  "Admin & Gestion", "IT & Numérique", "QHSE", "Électricité",
  "Hôtellerie & Restauration", "Art & Graphiques",
  "Anglais Professionnel", "Agroalimentaire", "Audiovisuel",
];

const missionPoints = [
  "Développer des compétences concrètes, directement mobilisables",
  "Intégrer des méthodes pédagogiques actives et actuelles",
  "Offrir un accompagnement personnalisé à chaque étape",
  "Valoriser les acquis par des certifications reconnues",
  "Soutenir la performance des entreprises et l'évolution des carrières",
  "Concevoir des formations sur mesure, alignées sur les besoins métiers",
];

const allBranches = [
  { num: "01", name: "Admin & Gestion",          tag: "Management",  img: adminGestionImg, href: "/branches/admin-gestion" },
  { num: "02", name: "IT & Numérique",            tag: "Technologie", img: itNumeriqueImg,  href: "/branches/it-numerique" },
  { num: "03", name: "Chimie & QHSE",             tag: "Industrie",   img: chimieQhseImg,   href: "/branches/chimie-qhse" },
  { num: "04", name: "Électricité",               tag: "Énergie",     img: electriciteImg,  href: "/branches/electricite-electronique" },
  { num: "05", name: "Hôtellerie & Restauration", tag: "Tourisme",    img: hotellerieImg,   href: "/branches/hotellerie-restauration" },
  { num: "06", name: "Art & Graphiques",          tag: "Créativité",  img: artGraphiquesImg,href: "/branches/art-graphiques" },
  { num: "07", name: "Anglais Professionnel",     tag: "Langues",     img: anglaisImg,      href: "/branches/anglais-professionnel" },
  { num: "08", name: "Industries Agroalimentaires", tag: "Industrie", img: agroImg,         href: "/branches/agroalimentaire" },
  { num: "09", name: "Techniques Audiovisuelles", tag: "Médias",      img: audiovisuelImg,  href: "/branches/audiovisuel" },
];

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };

export default function Home() {
  const [hoveredIdx, setHoveredIdx] = useState(0);

  return (
    <>
      <Header />

      {/* ===== HERO ===== */}
      <section className="hero" id="accueil">
        <div className="hero__bg">
          <Image
            src={bannerImg}
            alt=""
            fill
            style={{ objectFit: "cover", opacity: 0.1 }}
            className="hero__bg-image-next"
            priority
          />
        </div>
        <span className="hero__watermark" aria-hidden="true">INA</span>

        <div className="hero__inner">
          {/* Left: Text content */}
          <motion.div
            className="hero__content"
            initial="hidden"
            animate="visible"
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.14 } } }}
          >
            <motion.div variants={fadeUp} className="hero__badge">
              <span className="hero__badge-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </span>
              <span>Agréé par l&apos;état</span>
            </motion.div>

            <motion.h1
              variants={{ hidden: { opacity: 0, y: 36 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7 } } }}
              className="hero__title"
            >
              L&apos;excellence<br />
              de la <em className="hero__title-accent">formation</em><br />
              professionnelle
            </motion.h1>

            <motion.p variants={fadeUp} className="hero__subtitle">
              Développez vos compétences et propulsez votre carrière avec nos
              programmes certifiants, conçus par des experts pour répondre aux
              exigences du marché.
            </motion.p>

            <motion.div variants={fadeUp} className="hero__actions">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link href="/branches" className="btn btn--primary" id="btn-formations">
                  Découvrir les formations
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link href="/inscrire" className="btn btn--outline" id="btn-contact">
                  Nous contacter
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { delay: 0.5 } } }}
              className="hero__location"
            >
              <span className="hero__location-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              <span>Hydra, Alger — Entrée / Sortie Autoroute</span>
            </motion.div>
          </motion.div>

          {/* Right: Floating image card */}
          <motion.div
            className="hero__visual"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="hero__img-card">
              <Image src={adminGestionImg} alt="Formation IN Academy" fill style={{ objectFit: "cover" }} />
              <div className="hero__img-overlay" />
            </div>
            <motion.div
              className="hero__stat-pill hero__stat-pill--a"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.85, type: "spring", stiffness: 160 }}
            >
              <span className="hero__stat-num">09</span>
              <span className="hero__stat-lbl">Branches</span>
            </motion.div>
            <motion.div
              className="hero__stat-pill hero__stat-pill--b"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.05, type: "spring", stiffness: 160 }}
            >
              <span className="hero__stat-num">100%</span>
              <span className="hero__stat-lbl">Certifiantes</span>
            </motion.div>
          </motion.div>
        </div>

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
      </section>

      {/* ===== MISSION ===== */}
      <section className="mission" id="mission">
        <div className="container">
          <div className="mission__layout">
            <div className="mission__left">
              <span className="section-eyebrow">Ce que nous faisons</span>
              <h2 className="section-title">Notre<br />Mission</h2>
              <span className="section-divider" />
              <p className="mission__description">
                Offrir un accompagnement personnalisé et des formations alignées
                sur les besoins métiers réels du marché algérien et international.
              </p>
              <div className="mission__feat">
                <span className="mission__feat-num">6</span>
                <span className="mission__feat-label">engagements<br />fondamentaux</span>
              </div>
            </div>

            <motion.div
              className="mission__right"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.09 } } }}
            >
              {missionPoints.map((text, i) => (
                <motion.div
                  key={i}
                  variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } }}
                  className="mission__point"
                >
                  <span className="mission__point-num">0{i + 1}</span>
                  <p className="mission__point-text">{text}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== BRANCHES ===== */}
      <section className="branches" id="branches">
        <div className="container">
          <div className="branches__header">
            <div>
              <span className="section-eyebrow">Domaines de formation</span>
              <h2 className="branches__title">Nos 09 Branches</h2>
            </div>
            <Link href="/branches" className="branches__link">
              Voir tout le catalogue
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="branches-modern">
            {/* Left: numbered list */}
            <motion.div
              className="branches-list"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }}
            >
              {allBranches.map((branch, i) => (
                <motion.div
                  key={branch.num}
                  variants={{ hidden: { opacity: 0, x: -16 }, visible: { opacity: 1, x: 0 } }}
                >
                  <Link
                    href={branch.href}
                    className={`branch-row${hoveredIdx === i ? " branch-row--active" : ""}`}
                    onMouseEnter={() => setHoveredIdx(i)}
                  >
                    <span className="branch-row__num">{branch.num}</span>
                    <div className="branch-row__info">
                      <h3 className="branch-row__name">{branch.name}</h3>
                      <span className="branch-row__tag">{branch.tag}</span>
                    </div>
                    <span className="branch-row__arrow">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </span>
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            {/* Right: sticky image preview */}
            <div className="branches-preview">
              <AnimatePresence mode="wait">
                <motion.div
                  key={hoveredIdx}
                  className="branches-preview__img"
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Image
                    src={allBranches[hoveredIdx].img}
                    alt={allBranches[hoveredIdx].name}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                  <div className="branches-preview__overlay" />
                  <div className="branches-preview__label">
                    <span className="branches-preview__num">{allBranches[hoveredIdx].num}</span>
                    <span className="branches-preview__name">{allBranches[hoveredIdx].name}</span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
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
                <Link href="/inscrire" className="btn btn--gold">S&apos;inscrire maintenant</Link>
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
