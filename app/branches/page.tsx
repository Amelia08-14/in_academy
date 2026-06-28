import Link from "next/link";
import Image from "next/image";
import Header from "../components/Header";
import Footer from "../components/Footer";

import adminGestionImg from "../images/Techniques administratives et gestio.png";
import itNumeriqueImg from "../images/Informatique – Numérique – Télécom .png";
import chimieQhseImg from "../images/Chimie industrielle – Plasturgie – QHSE.png";
import electriciteImg from "../images/Électricité – Électronique – Énergétique .png";
import hotellerieImg from "../images/Hôtellerie – Restauration – Tourisme.png";
import artGraphiquesImg from "../images/Art & Industries graphiques.png";
import audiovisuelImg from "../images/Techniques audiovisuelles .png";
import agroalimentaireImg from "../images/Industries agroalimentaires.png";
import anglaisImg from "../images/Technique-expression-Anglais.png";

export const metadata = {
  title: "Nos branches de formation — IN ACADEMY",
  description:
    "09 domaines de compétences stratégiques. Formations certifiantes de 1 à 7 jours.",
};

const branches = [
  {
    id: "admin-gestion",
    num: "01",
    image: adminGestionImg,
    title: "Techniques administratives et gestion",
    shortTitle: "Admin & Gestion",
    description: "Formations ciblées sur les enjeux techniques, réglementaires et commerciaux du secteur.",
    formations: 4,
    tag: "Management",
  },
  {
    id: "it-numerique",
    num: "02",
    image: itNumeriqueImg,
    title: "Informatique – Numérique – Télécom",
    shortTitle: "IT & Numérique",
    description: "Sécuriser les systèmes d’information et monter en compétences sur les outils numériques.",
    formations: 4,
    tag: "Technologie",
  },
  {
    id: "chimie-qhse",
    num: "03",
    image: chimieQhseImg,
    title: "Chimie industrielle – Plasturgie – QHSE",
    shortTitle: "Chimie & QHSE",
    description: "Protéger les personnes et l’environnement, réduire les accidents.",
    formations: 5,
    tag: "Industrie",
  },
  {
    id: "electricite",
    num: "04",
    image: electriciteImg,
    title: "Électricité – Électronique – Énergétique",
    shortTitle: "Électricité",
    description: "Alimentation, automatisation et sécurité des systèmes électriques.",
    formations: 6,
    tag: "Énergie",
  },
  {
    id: "hotellerie",
    num: "05",
    image: hotellerieImg,
    title: "Hôtellerie – Restauration – Tourisme",
    shortTitle: "Hôtellerie & Restauration",
    description: "Maîtriser les techniques de service et garantir la qualité d’accueil.",
    formations: 5,
    tag: "Tourisme",
  },
  {
    id: "art-graphiques",
    num: "06",
    image: artGraphiquesImg,
    title: "Art & Industries graphiques",
    shortTitle: "Art & Graphiques",
    description: "Maîtriser les outils de création visuelle et les techniques graphiques.",
    formations: 4,
    tag: "Créativité",
  },
  {
    id: "audiovisuel",
    num: "07",
    image: audiovisuelImg,
    title: "Techniques audiovisuelles",
    shortTitle: "Audiovisuel",
    description: "Captation, montage et diffusion de contenus audiovisuels professionnels.",
    formations: 4,
    tag: "Médias",
  },
  {
    id: "agroalimentaire",
    num: "08",
    image: agroalimentaireImg,
    title: "Industries agroalimentaires",
    shortTitle: "Agroalimentaire",
    description: "Processus de production, contrôle qualité et sécurité alimentaire.",
    formations: 5,
    tag: "Industrie",
  },
  {
    id: "anglais",
    num: "09",
    image: anglaisImg,
    title: "Technique d’expression : Anglais",
    shortTitle: "Anglais Professionnel",
    description: "Anglais professionnel et certifications TOEIC® pour le monde du travail.",
    formations: 4,
    tag: "Langues",
  },
];

export default function BranchesPage() {
  return (
    <>
      <Header />

      {/* ===== HERO ===== */}
      <section className="branches-page-hero">
        <div className="branches-page-hero__bg" />
        <span className="branches-page-hero__watermark" aria-hidden="true">09</span>
        <div className="container branches-page-hero__inner">
          <span className="section-eyebrow branches-page-hero__eyebrow">Domaines de formation</span>
          <h1 className="branches-page-hero__title">Nos 09 Branches</h1>
          <p className="branches-page-hero__sub">
            09 domaines de compétences stratégiques —<br />
            formations certifiantes de 1 à 7 jours, alignées sur les besoins du marché.
          </p>
          <div className="branches-page-hero__stats">
            <div className="branches-page-hero__stat">
              <span className="branches-page-hero__stat-num">09</span>
              <span className="branches-page-hero__stat-lbl">Branches</span>
            </div>
            <div className="branches-page-hero__stat-sep" />
            <div className="branches-page-hero__stat">
              <span className="branches-page-hero__stat-num">100%</span>
              <span className="branches-page-hero__stat-lbl">Certifiantes</span>
            </div>
            <div className="branches-page-hero__stat-sep" />
            <div className="branches-page-hero__stat">
              <span className="branches-page-hero__stat-num">1–7</span>
              <span className="branches-page-hero__stat-lbl">Jours</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== GRID ===== */}
      <section className="branches-listing">
        <div className="container">
          <div className="branches-listing__grid">
            {branches.map((branch, i) => (
              <Link
                href={`/branches/${branch.id}`}
                className="bl-card"
                key={branch.id}
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                <div className="bl-card__img">
                  <Image src={branch.image} alt={branch.title} fill style={{ objectFit: "cover" }} />
                </div>
                <div className="bl-card__overlay" />
                <div className="bl-card__content">
                  <div className="bl-card__top">
                    <span className="bl-card__num">{branch.num}</span>
                    <span className="bl-card__tag">{branch.tag}</span>
                  </div>
                  <div className="bl-card__bottom">
                    <h3 className="bl-card__title">{branch.shortTitle}</h3>
                    <p className="bl-card__desc">{branch.description}</p>
                    <div className="bl-card__footer">
                      <span className="bl-card__formations">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                        </svg>
                        {branch.formations} formations
                      </span>
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

      <Footer />
    </>
  );
}
