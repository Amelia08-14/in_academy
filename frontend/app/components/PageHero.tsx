"use client";

import Link from "next/link";
import Image from "next/image";

interface PageHeroProps {
  title: string;
  subtitle: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  image?: string;
  imagePosition?: string;
}

export default function PageHero({
  title,
  subtitle,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  image = "/banner.png",
  imagePosition = "75% center",
}: PageHeroProps) {
  return (
    <section className="page-hero-v2">
      <div className="page-hero-v2__bg">
        <Image
          src={image}
          alt=""
          fill
          sizes="100vw"
          quality={90}
          priority
          style={{ objectFit: "cover", objectPosition: imagePosition }}
        />
        <div className="page-hero-v2__scrim" />
      </div>

      <div className="container page-hero-v2__inner">
        <div className="page-hero-v2__text">
          <h1 className="page-hero-v2__title">{title}</h1>
          <p className="page-hero-v2__subtitle">{subtitle}</p>
          {(primaryLabel || secondaryLabel) && (
            <div className="page-hero-v2__actions">
              {primaryLabel && primaryHref && (
                <Link href={primaryHref} className="btn btn--primary">
                  {primaryLabel}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
              {secondaryLabel && secondaryHref && (
                <Link href={secondaryHref} className="btn btn--outline">{secondaryLabel}</Link>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
