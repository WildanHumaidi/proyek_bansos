/* ─── Ikon ──────────────────────────────────────────────────────────────────
   Digambar sendiri, satu ketebalan garis (1.75), sudut bulat. Bukan pustaka
   ikon: halaman ini hanya butuh enam glyph dan memuat satu set penuh berarti
   memuat 300 bentuk yang tidak dipakai. Tidak ada sparkle, bintang, atau
   kilat, karena tidak ada yang perlu disimbolkan dengan itu di halaman ini.
   ─────────────────────────────────────────────────────────────────────────── */
const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
};

export const IconCheck = (p) => (
  <svg {...base} {...p}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const IconChevron = (p) => (
  <svg {...base} {...p}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const IconArrow = (p) => (
  <svg {...base} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const IconInfo = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
);

export const IconLogin = (p) => (
  <svg {...base} {...p}>
    <path d="M14 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <path d="M10 17 5 12l5-5M5 12h11" />
  </svg>
);

export const IconUserPlus = (p) => (
  <svg {...base} {...p}>
    <path d="M15 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-2A4.5 4.5 0 0 0 4 18.5V20" />
    <circle cx="9.5" cy="7.5" r="3.5" />
    <path d="M17.5 7v6M14.5 10h6" />
  </svg>
);

export const IconHouse = (p) => (
  <svg {...base} {...p}>
    <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />
  </svg>
);
