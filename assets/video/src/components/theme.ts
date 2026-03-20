// Design tokens matching the Caliber LP
export const theme = {
  bg: "#0a0a0a",
  surface: "#111113",
  surfaceBorder: "#1e1e22",
  surfaceHover: "#18181c",

  // Brand gradient (logo bars)
  brand1: "#fdba74", // lightest
  brand2: "#fb923c", // mid
  brand3: "#f97316", // deepest / primary

  // Accent
  accent: "#7dd3fc", // cyan/blue
  accentDim: "#38bdf8",

  // Semantic
  green: "#22c55e",
  greenDim: "#16a34a",
  red: "#ef4444",
  yellow: "#eab308",

  // Text
  text: "#f5f5f5",
  textSecondary: "#a1a1aa",
  textMuted: "#52525b",

  // Typography
  fontSans: "'Inter', system-ui, -apple-system, sans-serif",
  fontMono: "'Geist Mono', 'JetBrains Mono', 'SF Mono', monospace",

  // Radii
  radius: 12,
  radiusSm: 8,
  radiusLg: 16,
} as const;
