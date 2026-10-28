"use client";

interface Props {
  size?: number;
  className?: string;
  tails?: number;
  mood?: "happy" | "sad" | "calm";
}

/** Маска девятихвостой лисы (китсу́нэ) с веером хвостов. */
export default function Kitsune({ size = 120, className = "", tails = 9, mood = "calm" }: Props) {
  const angles = Array.from({ length: tails }, (_, i) => -68 + (136 / Math.max(1, tails - 1)) * i);

  return (
    <svg viewBox="0 0 200 200" width={size} height={size} className={className} aria-hidden>
      <defs>
        <radialGradient id="kitsuneHalo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffe0ee" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#ffe0ee" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="tailGrad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#ffb8d3" />
          <stop offset="70%" stopColor="#fff6fa" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
      </defs>

      <circle cx="100" cy="105" r="86" fill="url(#kitsuneHalo)" />

      <g className="tail-swish">
        {angles.map((a, i) => (
          <g key={i} transform={`rotate(${a} 100 150)`}>
            <path
              d="M100 150c-4-30-16-46-10-70 4-16 16-24 22-14 8 14 2 30-2 46-3 12-4 26-6 38z"
              fill="url(#tailGrad)"
              stroke="#f6a8c6"
              strokeWidth="1.4"
              opacity={0.92}
            />
            <path d="M96 82c6-8 12-8 16-2" stroke="#e4572e" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.75" />
          </g>
        ))}
      </g>

      {/* уши */}
      <path d="M58 96 50 52l38 22z" fill="#ffffff" stroke="#f0a6c2" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M142 96 150 52l-38 22z" fill="#ffffff" stroke="#f0a6c2" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M62 88 58 64l20 12z" fill="#ffc2da" />
      <path d="M138 88 142 64l-20 12z" fill="#ffc2da" />

      {/* маска */}
      <path
        d="M100 62c34 0 56 22 56 52 0 30-26 54-56 54S44 144 44 114c0-30 22-52 56-52z"
        fill="#fffafc"
        stroke="#eda1bf"
        strokeWidth="2.6"
      />

      {/* красные узоры */}
      <path d="M62 104c10 4 16 12 18 22" stroke="#e4572e" strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <path d="M138 104c-10 4-16 12-18 22" stroke="#e4572e" strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <path d="M76 84c6-6 14-9 24-9M124 84c-6-6-14-9-24-9" stroke="#f26fa4" strokeWidth="2.6" fill="none" strokeLinecap="round" opacity="0.7" />

      {/* глаза */}
      {mood === "sad" ? (
        <>
          <path d="M74 116c6-5 14-5 20 0" stroke="#43243a" strokeWidth="3.4" fill="none" strokeLinecap="round" />
          <path d="M106 116c6-5 14-5 20 0" stroke="#43243a" strokeWidth="3.4" fill="none" strokeLinecap="round" />
        </>
      ) : mood === "happy" ? (
        <>
          <path d="M74 118c5-8 15-8 20 0" stroke="#43243a" strokeWidth="3.4" fill="none" strokeLinecap="round" />
          <path d="M106 118c5-8 15-8 20 0" stroke="#43243a" strokeWidth="3.4" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="84" cy="116" rx="6.5" ry="8" fill="#43243a" />
          <ellipse cx="116" cy="116" rx="6.5" ry="8" fill="#43243a" />
          <circle cx="86.5" cy="113" r="2.2" fill="#fff" />
          <circle cx="118.5" cy="113" r="2.2" fill="#fff" />
        </>
      )}

      {/* нос и рот */}
      <path d="M96 138h8l-4 5z" fill="#e4572e" />
      <path
        d={mood === "sad" ? "M90 152c6-4 14-4 20 0" : "M90 148c6 6 14 6 20 0"}
        stroke="#43243a"
        strokeWidth="2.8"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="72" cy="136" r="5" fill="#ffc2da" opacity="0.75" />
      <circle cx="128" cy="136" r="5" fill="#ffc2da" opacity="0.75" />
    </svg>
  );
}
