type CachetProps = {
  size?: number;
  className?: string;
};

const RING_TEXT = "AGRÉÉ · PAR · L'ÉTAT · ";

export default function Cachet({ size = 128, className = "" }: CachetProps) {
  return (
    <svg
      viewBox="0 0 160 160"
      width={size}
      height={size}
      className={`cachet ${className}`}
      role="img"
      aria-label="Sceau — Agréé par l'état"
    >
      <defs>
        <path id="cachet-ring" d="M80,80 m-62,0 a62,62 0 1,1 124,0 a62,62 0 1,1 -124,0" />
      </defs>

      <circle cx="80" cy="80" r="76" className="cachet__outer" />
      <circle cx="80" cy="80" r="62" className="cachet__ring" />
      <circle cx="80" cy="80" r="48" className="cachet__inner" />

      <text className="cachet__text">
        <textPath href="#cachet-ring" startOffset="0%">
          {RING_TEXT.repeat(3)}
        </textPath>
      </text>

      <g className="cachet__star" transform="translate(80,72)">
        <path d="M0,-16 L3.8,-5.5 15,-5.5 6,1.4 9.4,12 0,5.2 -9.4,12 -6,1.4 -15,-5.5 -3.8,-5.5 Z" />
      </g>
      <text x="80" y="98" textAnchor="middle" className="cachet__mono-label">IN ACADEMY</text>
    </svg>
  );
}
