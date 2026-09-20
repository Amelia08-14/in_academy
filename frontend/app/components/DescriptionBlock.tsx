import type { ReactNode } from "react";
import { isArabicText } from "@/lib/format";

// Rend une description saisie en texte brut dans le back-office :
//  - une ligne "- item" / "• item" / "● item" → puce
//  - une ligne "Niveau 1 — … : …" → liste de niveaux
//  - une ligne courte sans ponctuation finale → sous-titre
//  - le reste → paragraphe
// `dir` : "rtl" pour l'arabe. Par défaut, détecté automatiquement d'après le texte.

const BULLET_RE = /^([-*]\s+|[•●▪]\s*)/;
const isBullet = (l: string) => BULLET_RE.test(l) && l.replace(BULLET_RE, "").length > 0;
const stripBullet = (l: string) => l.replace(BULLET_RE, "");
const isLevel = (l: string) => /^niveau\s+\d/i.test(l);
// Un titre court : ligne brève, sans ponctuation finale ni ":", et pas un item "Niveau".
const isHeading = (l: string) =>
  l.length <= 46 && !isBullet(l) && !isLevel(l) && !/[.:!?،؟]$/.test(l) && !/\s:\s/.test(l);

function LevelLine({ text }: { text: string }) {
  // "Niveau 1 — Découverte : contenu…" → préfixe en gras + contenu.
  const m = text.match(/^(.*?:)\s*(.*)$/);
  if (m) {
    return (
      <span>
        <strong>{m[1]}</strong> {m[2]}
      </span>
    );
  }
  return <span>{text}</span>;
}

export default function DescriptionBlock({ text, dir }: { text: string; dir?: "ltr" | "rtl" }) {
  const direction = dir ?? (isArabicText(text) ? "rtl" : "ltr");
  const lines = text.split("\n").map((l) => l.trim());
  const out: ReactNode[] = [];
  let bullets: string[] = [];
  let levels: string[] = [];

  const flushBullets = (key: string) => {
    if (bullets.length) {
      out.push(
        <ul key={`ul-${key}`}>
          {bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      );
      bullets = [];
    }
  };
  const flushLevels = (key: string) => {
    if (levels.length) {
      out.push(
        <ol className="session-detail__levels" key={`ol-${key}`}>
          {levels.map((l, i) => (
            <li key={i}>
              <LevelLine text={l} />
            </li>
          ))}
        </ol>
      );
      levels = [];
    }
  };

  lines.forEach((line, i) => {
    if (!line) {
      flushBullets(String(i));
      flushLevels(String(i));
      return;
    }
    if (isBullet(line)) {
      flushLevels(String(i));
      bullets.push(stripBullet(line));
      return;
    }
    if (isLevel(line)) {
      flushBullets(String(i));
      levels.push(line);
      return;
    }
    flushBullets(String(i));
    flushLevels(String(i));
    if (isHeading(line)) out.push(<h3 key={i}>{line}</h3>);
    else out.push(<p key={i}>{line}</p>);
  });
  flushBullets("end");
  flushLevels("end");

  return (
    <div
      className={`session-detail__description${direction === "rtl" ? " session-detail__description--rtl" : ""}`}
      dir={direction}
      lang={direction === "rtl" ? "ar" : undefined}
    >
      {out}
    </div>
  );
}
