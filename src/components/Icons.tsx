interface P {
  className?: string;
}

const base = "w-5 h-5";
const s = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const IconTorii = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <path d="M3 5h18M4.5 8.5h15M7 8.5V20M17 8.5V20M6 5c0 1.6 1 3 6 3s6-1.4 6-3" />
  </svg>
);

export const IconSakura = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <path d="M12 12c0-3 1.2-5.2 3-5.2S18 8.4 18 10c0 2.2-2.6 3.4-6 2zM12 12c-3 0-5.2-1.2-5.2-3S8.4 6 10 6c2.2 0 3.4 2.6 2 6zM12 12c0 3-1.2 5.2-3 5.2S6 15.6 6 14c0-2.2 2.6-3.4 6-2zM12 12c3 0 5.2 1.2 5.2 3S15.6 21 14 21c-2.2 0-3.4-2.6-2-6z" />
    <circle cx="12" cy="12" r="1.4" />
  </svg>
);

export const IconClock = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export const IconUpload = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <path d="M12 16V4m0 0L8 8m4-4 4 4" />
    <path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15" />
  </svg>
);

export const IconImage = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="m4.5 17 4.2-4a2 2 0 0 1 2.7 0l4 3.7m0 0 1.5-1.3a2 2 0 0 1 2.6 0l1 1" />
  </svg>
);

export const IconTrash = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <path d="M4.5 6.5h15M9 6.5V4.8A1.3 1.3 0 0 1 10.3 3.5h3.4A1.3 1.3 0 0 1 15 4.8v1.7M6.5 6.5 7.4 20a1 1 0 0 0 1 .9h7.2a1 1 0 0 0 1-.9l.9-13.5" />
  </svg>
);

export const IconPlus = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconCalendar = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
    <path d="M3.5 10h17M8 3.5v4M16 3.5v4" />
  </svg>
);

export const IconPhone = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <path d="M6.2 3.8h3l1.4 3.6-2 1.4a12 12 0 0 0 5.6 5.6l1.4-2 3.6 1.4v3a2 2 0 0 1-2.2 2A16.8 16.8 0 0 1 4.2 6a2 2 0 0 1 2-2.2z" />
  </svg>
);

export const IconSparkle = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <path d="M12 3.5 13.8 9l5.5 1.8-5.5 1.8L12 18.1l-1.8-5.5L4.7 10.8 10.2 9z" />
    <path d="M18.5 4v3M20 5.5h-3" />
  </svg>
);

export const IconAlert = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <path d="M12 4.5 21 19.5H3z" />
    <path d="M12 10v4M12 17h.01" />
  </svg>
);

export const IconCheck = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </svg>
);

export const IconX = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const IconSettings = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.3a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3.3a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.1-2.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 2.8 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.3a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1z" />
  </svg>
);

export const IconHeart = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <path d="M12 20s-7.5-4.4-7.5-9.4A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7.5 2.6C19.5 15.6 12 20 12 20z" />
  </svg>
);

export const IconRoute = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <circle cx="6" cy="18" r="2.5" />
    <circle cx="18" cy="6" r="2.5" />
    <path d="M8.5 18h5a3.5 3.5 0 0 0 0-7h-3a3.5 3.5 0 0 1 0-7h1" />
  </svg>
);

export const IconMoon = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
  </svg>
);

export const IconRefresh = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <path d="M20 11.5A8 8 0 1 0 18.4 17" />
    <path d="M20 4.5v6h-6" />
  </svg>
);

export const IconSave = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <path d="M5.5 4.5h10L19.5 8v11.5H5.5z" />
    <path d="M8.5 4.5v5h7v-5M8.5 19.5v-5h7v5" />
  </svg>
);

export const IconChevron = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <path d="m9 5 7 7-7 7" />
  </svg>
);

export const IconCopy = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
    <path d="M15.5 5.5H6.5a2 2 0 0 0-2 2v9" />
  </svg>
);

export const IconBook = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <path d="M4 5.5A2 2 0 0 1 6 3.5h5v17H6a2 2 0 0 0-2 2z" />
    <path d="M20 5.5a2 2 0 0 0-2-2h-5v17h5a2 2 0 0 1 2 2z" />
  </svg>
);

export const IconBolt = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <path d="M13 2.5 5 13.5h5.5L10 21.5 19 10h-5.8z" />
  </svg>
);
