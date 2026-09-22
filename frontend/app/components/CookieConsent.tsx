"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";

const CONSENT_KEY = "ia_cookie_consent";
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

type Consent = "granted" | "denied";

// Bandeau de consentement cookies (RGPD) : le pixel Meta ne se charge
// qu'après acceptation explicite, jamais par défaut.
export default function CookieConsent() {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [bannerVisible, setBannerVisible] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(CONSENT_KEY);
    // Lu une seule fois au montage : la préférence vient du localStorage,
    // indisponible côté serveur, donc impossible à lire en lazy initial state.
    if (stored === "granted" || stored === "denied") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConsent(stored);
    } else {
      setBannerVisible(true);
    }
  }, []);

  function choose(value: Consent) {
    window.localStorage.setItem(CONSENT_KEY, value);
    setConsent(value);
    setBannerVisible(false);
  }

  return (
    <>
      {consent === "granted" && META_PIXEL_ID && (
        <>
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${META_PIXEL_ID}');
              fbq('track', 'PageView');
            `}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}

      {bannerVisible && (
        <div className="cookie-banner" role="dialog" aria-label="Consentement aux cookies">
          <p className="cookie-banner__text">
            Nous utilisons des cookies de mesure d&apos;audience pour améliorer votre expérience sur IN ACADEMY.
            Vous pouvez accepter ou refuser leur dépôt à tout moment.{" "}
            <Link href="/confidentialite">En savoir plus</Link>.
          </p>
          <div className="cookie-banner__actions">
            <button type="button" className="cookie-banner__btn cookie-banner__btn--ghost" onClick={() => choose("denied")}>
              Refuser
            </button>
            <button type="button" className="cookie-banner__btn cookie-banner__btn--primary" onClick={() => choose("granted")}>
              Accepter
            </button>
          </div>
        </div>
      )}
    </>
  );
}
