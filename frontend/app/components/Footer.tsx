"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function Footer() {
  return (
    <footer className="footer-light" id="footer">
      <div className="container">
        <motion.div
          className="footer-light__cards"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
        >
          {/* Carte marque (dégradé or) */}
          <div className="footer-light__brand">
            <Link href="/" className="footer-light__logo">
              <Image
                src="/images/logo_in_academy_white.png"
                alt="IN Academy"
                width={92}
                height={92}
                className="footer-light__logo-img"
              />
            </Link>
            <p className="footer-light__desc">
              Nous mobilisons le pouvoir de la formation et de l&apos;éducation
              pour créer des parcours d&apos;excellence. Développer et améliorer
              les compétences de nos partenaires.
            </p>
          </div>

          {/* Carte infos (blanche) */}
          <div className="footer-light__info">
            <div className="footer-light__cols">
              <div className="footer-light__col">
                <h4 className="footer-light__heading">Navigation</h4>
                <ul className="footer-light__list">
                  <li><Link href="/">Accueil</Link></li>
                  <li><Link href="/branches">Branches</Link></li>
                  <li><Link href="/formateurs">Formateurs</Link></li>
                  <li><Link href="/formations/particulier">Formations</Link></li>
                  <li><Link href="/evenements">Nos Events</Link></li>
                </ul>
              </div>

              <div className="footer-light__col">
                <h4 className="footer-light__heading">Nos Formations</h4>
                <ul className="footer-light__list">
                  <li><Link href="/branches/transport-logistique">Transport &amp; Logistique</Link></li>
                  <li><Link href="/branches/hse-securite">HSE &amp; Sécurité</Link></li>
                  <li><Link href="/branches/finance-comptabilite">Finance &amp; Comptabilité</Link></li>
                  <li><Link href="/branches/achats-international">Achats &amp; Commerce International</Link></li>
                </ul>
              </div>
            </div>

            <div className="footer-light__contact">
              <a href="mailto:formation.in.academy@gmail.com" className="footer-light__contact-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                formation.in.academy@gmail.com
              </a>
              <a href="tel:+213560067485" className="footer-light__contact-item footer-light__contact-item--phone">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                0560 06 74 85
              </a>

              <form className="footer-light__newsletter" onSubmit={(e) => e.preventDefault()}>
                <input type="email" placeholder="Votre email" aria-label="Votre email" required />
                <button type="submit" className="btn btn--primary footer-light__newsletter-btn">
                  Contacter Nous
                </button>
              </form>
            </div>
          </div>
        </motion.div>

        <div className="footer-light__bottom">
          <p>© 2026 IN Academy — La Maison IN Groupe. Tous droits réservés.</p>
          <div className="footer-light__socials">
            <Link href="#" aria-label="Facebook" className="footer-light__social">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
            </Link>
            <Link href="#" aria-label="X" className="footer-light__social">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4l7 9-7 7h2.5l5.75-5.75L16.5 20H20l-7.25-9.25L19.5 4H17l-5.25 5.25L8 4z"/></svg>
            </Link>
            <Link href="#" aria-label="Instagram" className="footer-light__social">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </Link>
            <Link href="#" aria-label="LinkedIn" className="footer-light__social">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM10 9h3.8v1.7h.05c.53-1 1.83-2.05 3.75-2.05 4 0 4.75 2.65 4.75 6.1V21h-4v-5.4c0-1.3 0-2.95-1.8-2.95s-2.05 1.4-2.05 2.85V21h-4z"/></svg>
            </Link>
            <Link href="#" aria-label="YouTube" className="footer-light__social">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23 12s0-3.5-.45-5.15a2.6 2.6 0 0 0-1.83-1.85C19.07 4.5 12 4.5 12 4.5s-7.07 0-8.72.5A2.6 2.6 0 0 0 1.45 6.85C1 8.5 1 12 1 12s0 3.5.45 5.15a2.6 2.6 0 0 0 1.83 1.85c1.65.5 8.72.5 8.72.5s7.07 0 8.72-.5a2.6 2.6 0 0 0 1.83-1.85C23 15.5 23 12 23 12zM9.75 15.5v-7l6 3.5z"/></svg>
            </Link>
          </div>
        </div>

        <div className="footer-light__legal">
          <Link href="/mentions-legales">Mentions légales</Link>
          <span aria-hidden="true">·</span>
          <Link href="/confidentialite">Politique de confidentialité</Link>
          <span aria-hidden="true">·</span>
          <Link href="/admin" style={{ opacity: 0.5 }}>Espace admin</Link>
        </div>
      </div>
    </footer>
  );
}
