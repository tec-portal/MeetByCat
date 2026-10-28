"use client";

/** Падающие лепестки сакуры. Детерминированный «random», чтобы не было рассинхрона при гидрации. */
function seeded(i: number, salt: number) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export default function Sakura({ count = 18 }: { count?: number }) {
  const petals = Array.from({ length: count }, (_, i) => {
    const left = seeded(i, 1) * 100;
    const size = 8 + seeded(i, 2) * 14;
    const duration = 11 + seeded(i, 3) * 14;
    const delay = -seeded(i, 4) * duration;
    const opacity = 0.35 + seeded(i, 5) * 0.5;
    const hue = seeded(i, 6) > 0.6 ? "#ffd7e7" : seeded(i, 6) > 0.3 ? "#ffb8d3" : "#ffe9f2";
    return { left, size, duration, delay, opacity, hue, key: i };
  });

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {petals.map((p) => (
        <svg
          key={p.key}
          className="petal"
          viewBox="0 0 24 24"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        >
          <path
            d="M12 2c3.6 3.1 6 6.2 6 9.4A6 6 0 0 1 12 22a6 6 0 0 1-6-10.6C6 8.2 8.4 5.1 12 2z"
            fill={p.hue}
          />
          <path d="M12 4.5v13" stroke="#ff94bc" strokeWidth="0.8" strokeLinecap="round" opacity="0.7" />
        </svg>
      ))}
      <div className="seigaiha absolute inset-x-0 bottom-0 h-40 opacity-40" />
    </div>
  );
}
