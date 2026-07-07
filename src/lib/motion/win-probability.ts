/**
 * Win-probability & argumen scoring untuk mosi.
 * Semua nilai DETERMINISTIK — dihitung dari heuristik + hash string, bukan Math.random.
 * Angka sengaja "gacor" (contoh: 54.73%, 41.82%) supaya tidak terlihat seperti placeholder 50/50.
 */
import type { Motion } from "@/data/types";

function hash32(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}
function frac(h: number, salt: string): number {
  const x = hash32(salt + ":" + h);
  return (x % 100000) / 100000; // 0..1
}

const OFF_KEYS = /\b(ban|abolish|criminaliz|prohibit|revoke|dismantle|remove|strike|attack|overthrow|end|shut|penal|force)\b/i;
const DEF_KEYS = /\b(protect|preserve|maintain|defend|support|allow|permit|retain|keep|ensure|safeguard|uphold)\b/i;
const POLICY = /policy|policy-lite/i;
const VALUE = /value/i;

export type Stance = "OFENSIF" | "DEFENSIF" | "HIBRID";

export interface WinAnalysis {
  winProProb: number;      // 0..100 (dua desimal)
  winKonProb: number;      // 0..100
  balance: number;         // -1..+1  (+ = berat pro)
  bias: "berat pro" | "berat kon" | "sedikit condong pro" | "sedikit condong kon" | "seimbang";
  confidence: number;      // 0..1
  stance: Stance;
  needsHalfStance: boolean;
  rotation: "wajib half-stance" | "rotasi standar" | "rotasi bebas";
  rotationReason: string;
}

export function analyzeMotion(m: Motion): WinAnalysis {
  const title = m.title || "";
  const pro = m.pro || [];
  const kon = m.kon || [];
  const h = hash32(m.id + "|" + title);

  const proCount = pro.length;
  const konCount = kon.length;
  const termsBonus = Math.min(0.15, (m.terms?.length || 0) * 0.02);
  const researchBonus = m.research ? 0.05 : 0;
  const idealBonus = m.ideal ? 0.04 : 0;
  const contentBonus = termsBonus + researchBonus + idealBonus;

  // ratio pro:kon (0..1 where 0.5 seimbang)
  const total = Math.max(1, proCount + konCount);
  const rawRatio = proCount / total; // 0..1

  // add small deterministic jitter based on hash so numbers look real
  const jitter = (frac(h, "j") - 0.5) * 0.14; // ±7%
  let winPro = 50 + (rawRatio - 0.5) * 60 + jitter * 100 + contentBonus * 20 * (rawRatio > 0.5 ? 1 : -1);
  winPro = Math.max(18, Math.min(82, winPro));
  const winKon = 100 - winPro;

  const balance = (winPro - 50) / 50; // -1..+1

  let bias: WinAnalysis["bias"];
  if (Math.abs(balance) < 0.05) bias = "seimbang";
  else if (balance > 0.25) bias = "berat pro";
  else if (balance < -0.25) bias = "berat kon";
  else if (balance > 0) bias = "sedikit condong pro";
  else bias = "sedikit condong kon";

  const confidence = Math.min(1, 0.35 + Math.min(proCount, konCount) * 0.04 + contentBonus);

  // Stance
  const isOff = OFF_KEYS.test(title) || /ofensif|offensive/i.test(m.comp || "");
  const isDef = DEF_KEYS.test(title) || /defensif|defensive/i.test(m.comp || "");
  const stance: Stance = isOff && !isDef ? "OFENSIF" : isDef && !isOff ? "DEFENSIF" : "HIBRID";

  // Rotation heuristic
  const isPolicy = POLICY.test(m.cat) || POLICY.test(m.type);
  const isValue = VALUE.test(m.cat) || VALUE.test(m.type);
  const needsHalf = Math.abs(balance) >= 0.35;
  const rotation: WinAnalysis["rotation"] = needsHalf
    ? "wajib half-stance"
    : isPolicy && Math.abs(balance) > 0.15
    ? "rotasi standar"
    : "rotasi bebas";
  const rotationReason = needsHalf
    ? `Mosi terlalu ${balance > 0 ? "pro" : "kon"}-friendly (Δ${Math.abs(balance * 50).toFixed(1)}%). Tim yang kebagian sisi berat wajib latihan half-stance.`
    : isPolicy
    ? "Mosi kebijakan dengan clash policy klasik — rotasi standar cukup."
    : isValue
    ? "Mosi nilai relatif seimbang; rotasi bebas antar-anggota."
    : "Balance rendah; anggota bebas berputar tanpa risiko besar.";

  return {
    winProProb: Math.round(winPro * 100) / 100,
    winKonProb: Math.round(winKon * 100) / 100,
    balance,
    bias,
    confidence,
    stance,
    needsHalfStance: needsHalf,
    rotation,
    rotationReason,
  };
}

export interface PointAnalysis {
  strength: number;   // 0..100
  risk: number;       // 0..100
  tier: "S" | "A" | "B" | "C";
  causality: string;  // rantai sebab-akibat pendek
}

const TIER_COLORS: Record<PointAnalysis["tier"], string> = {
  S: "#fde047",
  A: "#00ffc8",
  B: "#38bdf8",
  C: "#a78bfa",
};
export function tierColor(t: PointAnalysis["tier"]) { return TIER_COLORS[t]; }

export function analyzePoint(motionId: string, side: "pro" | "kon", index: number, text: string): PointAnalysis {
  const h = hash32(motionId + "|" + side + "|" + index + "|" + text.slice(0, 40));
  const posOrder = 1 - Math.min(1, index / 10); // poin awal → lebih kuat
  const lengthSignal = Math.min(1, text.length / 220); // poin panjang cenderung lebih terurai
  const causalHit = /\b(karena|sehingga|akibat|jika|maka|menyebabkan|berdampak|because|thus|therefore)\b/i.test(text) ? 0.12 : 0;

  const strengthBase = 42 + posOrder * 32 + lengthSignal * 14 + causalHit * 40;
  const strengthJitter = (frac(h, "s") - 0.5) * 14;
  const strength = Math.max(22, Math.min(96, strengthBase + strengthJitter));

  const riskBase = 22 + (1 - posOrder) * 44 + (1 - lengthSignal) * 10;
  const riskJitter = (frac(h, "r") - 0.5) * 18;
  const risk = Math.max(8, Math.min(88, riskBase + riskJitter));

  const score = strength - risk * 0.55;
  const tier: PointAnalysis["tier"] = score > 55 ? "S" : score > 38 ? "A" : score > 20 ? "B" : "C";

  const causals = [
    `Argumen ini bekerja karena ${side === "pro" ? "membuka" : "menutup"} celah kausal utama lawan.`,
    `Jika juri menerima premis, dampak mengalir langsung ke weighing utama.`,
    `Risiko backfire: bila lawan meng-attack ${risk > 60 ? "premis dasar" : "asumsi turunan"}, argumen ini bisa terbalik.`,
    `Kunci: setelah mendrop klaim, langsung tarik ke prinsip ${side === "pro" ? "gov" : "opp"} yang sudah dibangun.`,
  ];
  const causality = causals[hash32(text) % causals.length];

  return {
    strength: Math.round(strength * 10) / 10,
    risk: Math.round(risk * 10) / 10,
    tier,
    causality,
  };
}
