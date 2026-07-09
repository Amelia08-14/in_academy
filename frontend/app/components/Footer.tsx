"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function Footer() {
  return (
    <footer className="footer-dark" id="footer">
      <div className="container">
        <motion.div 
          className="footer-dark__inner"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
            visible: { transition: { staggerChildren: 0.1 } },
            hidden: {}
          }}
        >
          {/* Column 1: Brand & Socials */}
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring" } } }} className="footer-dark__col footer-dark__col--brand">
            <Link href="/" className="footer-dark__logo">
              <Image
                src="/images/logo_in_academy_white.png"
                alt="IN Academy"
                width={64}
                height={64}
                className="footer-dark__logo-img"
              />
            </Link>
            <p className="footer-dark__desc">
              Nous mobilisons le pouvoir de la formation et de l&apos;éducation
              pour créer des parcours d&apos;excellence. Développer et améliorer
              les compétences de nos partenaires.
            </p>
            <div className="footer-dark__socials">
              <Link href="#" className="footer-dark__social-link" aria-label="Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </Link>
              <Link href="#" className="footer-dark__social-link" aria-label="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </Link>
              <Link href="#" className="footer-dark__social-link" aria-label="LinkedIn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
              </Link>
              <Link href="#" className="footer-dark__social-link" aria-label="X (Twitter)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z"/><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"/></svg>
              </Link>
            </div>
          </motion.div>

          {/* Column 2: Liens Rapides */}
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring" } } }} className="footer-dark__col">
            <h4 className="footer-dark__heading">LIENS RAPIDES</h4>
            <ul className="footer-dark__list">
              <li><Link href="/">Accueil</Link></li>
              <li><Link href="/branches">Nos formations</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </motion.div>

          {/* Column 3: Domaines de formation */}
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring" } } }} className="footer-dark__col">
            <h4 className="footer-dark__heading">NOS FORMATIONS</h4>
            <ul className="footer-dark__list">
              <li><Link href="/branches/it-digital">IT & Digital</Link></li>
              <li><Link href="/branches/rh-management">RH & Management</Link></li>
              <li><Link href="/branches/hse-securite">HSE & Sécurité</Link></li>
              <li><Link href="/branches/qualite-production">Qualité & Production</Link></li>
              <li><Link href="/branches">Voir toutes les formations...</Link></li>
            </ul>
          </motion.div>

          {/* Column 4: Contact & Newsletter */}
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring" } } }} className="footer-dark__col footer-dark__col--contact">
            <h4 className="footer-dark__heading">CONTACT</h4>
            <ul className="footer-dark__contact-list">
              <li>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <span>Hydra, Alger</span>
              </li>
              <li>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                <span>contact@imig-dz.com</span>
              </li>
              <li>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                <span>+213 (0) 20 07 17 00</span>
              </li>
            </ul>

            <div className="footer-dark__newsletter">
              <h4 className="footer-dark__heading">NEWSLETTER</h4>
              <form className="footer-dark__newsletter-form">
                <input type="email" placeholder="Votre email" required />
                <button type="submit" aria-label="S'abonner">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <div className="footer-dark__bottom">
        <div className="container footer-dark__bottom-inner">
          <p>© 2026 IN Academy — La Maison IN Groupe. Tous droits réservés.</p>
          <div className="footer-dark__legal-links">
            <Link href="#mentions">Mentions légales</Link>
            <Link href="#confidentialite">Politique de confidentialité</Link>
            <Link href="/connexion" style={{ opacity: 0.4, fontSize: "11px" }}>Espace admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
