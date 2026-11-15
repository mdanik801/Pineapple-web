export type SwatchInput = {
  color?: string | null;
  value?: string | null;
  image?: string | null;
};

const NAMED: Record<string, string> = {
  black: "#111827",
  white: "#FFFFFF",
  blue: "#2563EB",
  navy: "#1E3A5F",
  "navy blue": "#1E3A5F",
  indigo: "#26416B",
  "indigo denim": "#2F4F7F",
  "denim blue": "#3A5F8A",
  denim: "#3A5F8A",
  red: "#DC2626",
  grey: "#808080",
  gray: "#808080",
  "light blue": "#7DD3FC",
  "sky blue": "#7DD3FC",
  "dark blue": "#1D4ED8",
  green: "#16A34A",
  olive: "#6B7280",
  khaki: "#B7A57A",
  beige: "#E7D8B1",
  brown: "#7C4A2D",
  maroon: "#7F1D1D",
  burgundy: "#6D1A36",
  purple: "#7C3AED",
  pink: "#EC4899",
  yellow: "#EAB308",
  orange: "#F97316",
  cream: "#F5EEDC",
  offwhite: "#F8F5EF",
  "off white": "#F8F5EF",
  charcoal: "#36454F",
  silver: "#BFC5CC",
  gold: "#C49A3E",
  teal: "#0F766E",
  turquoise: "#14B8A6",
  mint: "#86EFAC",
  peach: "#FDBA74",
  lavender: "#C4B5FD",
  mustard: "#CA8A04",
  rust: "#B45309",
  wine: "#722F37",
  tan: "#D2B48C",
  coffee: "#6F4E37",
  chocolate: "#4E342E",
  multi: "linear-gradient(135deg,#ef4444,#f59e0b,#22c55e,#3b82f6,#a855f7)",
  multicolor: "linear-gradient(135deg,#ef4444,#f59e0b,#22c55e,#3b82f6,#a855f7)",
};

function norm(s: string) {
  return s.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

export function isExplicitColorValue(v?: string | null): boolean {
  if (!v || typeof v !== "string") return false;
  const s = v.trim();
  return /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(s)
    || /^rgba?\(/i.test(s)
    || /^hsla?\(/i.test(s)
    || /^linear-gradient\(/i.test(s);
}

export function extractExplicitColorValue(attrs: any, direct?: string | null): string | null {
  const candidates = [
    direct,
    attrs?.color_code, attrs?.color_hex, attrs?.colorHex, attrs?.colorCode,
    attrs?.hex, attrs?.hex_code, attrs?.hexCode,
    attrs?.swatch, attrs?.swatch_color, attrs?.swatchColor,
    attrs?.colour_code, attrs?.colour_hex,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && isExplicitColorValue(c)) return c.trim();
  }
  for (const c of [attrs?.Color, attrs?.color, attrs?.Colour, attrs?.colour]) {
    if (typeof c === "string" && isExplicitColorValue(c)) return c.trim();
  }
  return null;
}

function hashColor(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) | 0;
  const hue = Math.abs(h) % 360;
  return `hsl(${hue} 45% 55%)`;
}

export function resolveSwatchBackground(name?: string | null, explicitValue?: string | null): { background: string; border?: string } {
  if (explicitValue && isExplicitColorValue(explicitValue)) {
    const b = explicitValue.trim();
    const light = /^#(fff|ffffff|f8fafc|fafafa|f5f5f5)$/i.test(b) || /white/i.test(b);
    return { background: b, border: light ? "#D1D5DB" : undefined };
  }
  const n = norm(String(name || ""));
  if (!n) return { background: "#CBD5E1", border: "#94A3B8" };
  if (NAMED[n]) {
    const b = NAMED[n];
    return { background: b, border: /white|#fff/i.test(b) ? "#D1D5DB" : undefined };
  }
  const tokens = n.split(" ");
  const has = (w: string) => tokens.includes(w) || n.includes(w);
  if (has("indigo") && has("denim")) return { background: "#2F4F7F" };
  if (has("denim")) return { background: "#3A5F8A" };
  if (has("navy")) return { background: "#1E3A5F" };
  if (has("charcoal")) return { background: "#36454F" };
  if (has("off") && has("white")) return { background: "#F8F5EF", border: "#D1D5DB" };
  if (has("light") && has("blue")) return { background: "#7DD3FC" };
  if (has("dark") && has("blue")) return { background: "#1D4ED8" };
  if (has("sky") && has("blue")) return { background: "#7DD3FC" };
  if (has("royal") && has("blue")) return { background: "#2563EB" };
  const sortedNames = Object.keys(NAMED).sort((a,b)=>b.length-a.length);
  for (const key of sortedNames) {
    if (n === key || n.includes(key)) {
      const b = NAMED[key];
      return { background: b, border: /white|#fff/i.test(b) ? "#D1D5DB" : undefined };
    }
  }
  return { background: hashColor(n) };
}
