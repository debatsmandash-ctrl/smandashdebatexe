// Font preset system — swap heading/body via CSS variables (--font-display, --font-sans)
// Actual @fontsource CSS is imported in main entry (styles.css imports).

export type FontPreset =
  | "default"      // Bebas Neue + DM Sans (existing)
  | "pixel"        // Press Start 2P + VT323
  | "genshin"      // Cinzel + Cormorant Unicase
  | "nasa"         // Orbitron + Michroma
  | "pixel-nasa"   // Press Start 2P + Orbitron
  | "genshin-mono";// Cinzel + Space Mono

export interface FontPresetDef {
  id: FontPreset;
  label: string;
  hint: string;
  display: string;  // heading / display font
  body: string;     // body font
  mono?: string;    // monospace override (fallback: Space Mono)
}

export const FONT_PRESETS: FontPresetDef[] = [
  { id: "default",      label: "DEFAULT",       hint: "Bebas + DM Sans",         display: '"Bebas Neue", sans-serif',           body: '"DM Sans", system-ui, sans-serif' },
  { id: "pixel",        label: "PIXEL",         hint: "Press Start 2P + VT323",  display: '"Press Start 2P", monospace',        body: '"VT323", monospace' },
  { id: "genshin",      label: "GENSHIN",       hint: "Cinzel + Cormorant",      display: '"Cinzel", serif',                    body: '"Cormorant Unicase", serif' },
  { id: "nasa",         label: "NASA TECH",     hint: "Orbitron + Michroma",     display: '"Orbitron", sans-serif',             body: '"Michroma", sans-serif' },
  { id: "pixel-nasa",   label: "PIXEL/NASA",    hint: "Press Start 2P + Orbitron", display: '"Press Start 2P", monospace',      body: '"Orbitron", sans-serif' },
  { id: "genshin-mono", label: "GENSHIN/MONO",  hint: "Cinzel + Space Mono",     display: '"Cinzel", serif',                    body: '"Space Mono", monospace' },
];

export function applyFontPreset(id: FontPreset) {
  if (typeof document === "undefined") return;
  const p = FONT_PRESETS.find((f) => f.id === id) || FONT_PRESETS[0];
  const root = document.documentElement.style;
  root.setProperty("--font-display", p.display);
  root.setProperty("--font-sans", p.body);
  if (p.mono) root.setProperty("--font-mono", p.mono);
}
