// Importer mosi format "HITS" (mosi_part1 / mosi_part2 / PART_2).
// Menambahkan mosi baru ke src/data/raw/motions.json (dedupe berdasarkan judul).
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve("src/data/raw/motions.json");
const files = process.argv.slice(2);

const raw = JSON.parse(fs.readFileSync(OUT, "utf8"));
const list = raw.motions || raw;
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const seen = new Set(list.map((m) => norm(m.title)));

let maxNum = 0;
for (const m of list) {
  const n = parseInt(String(m.id).replace(/\D/g, ""), 10);
  if (Number.isFinite(n)) maxNum = Math.max(maxNum, n);
}

const CAT_RULES = [
  [/ekonomi|fiskal|pajak|industri|energi|investasi/, "ekonomi"],
  [/politik|aktor|pemerintah|demokrasi|konstitus/, "politik"],
  [/hukum|pidana|regulasi|yudis/, "hukum"],
  [/kesehatan|medis|gizi/, "kesehatan"],
  [/lingkungan|iklim|energi/, "lingkungan"],
  [/pendidikan|sekolah|kampus|akademik/, "pendidikan"],
  [/gender|feminis|perempuan/, "feminisme"],
  [/sosial|budaya|masyarakat|ketenagakerjaan|konsumen/, "sosial"],
  [/teknologi|digital|ai|sains/, "sains"],
  [/internasional|geopolit|diplomasi/, "hi"],
  [/filosof|etika|eksistensi/, "filsafat"],
  [/psikolog/, "psikologi"],
  [/agama|religi/, "agama"],
];
const catOf = (tipe, hybrid) => {
  const s = `${tipe} ${hybrid}`.toLowerCase();
  for (const [re, c] of CAT_RULES) if (re.test(s)) return c;
  return "sosial";
};

function parsePoints(block) {
  const out = [];
  const lines = block.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\[([SABCN])\]\s*(.+?)\s*\|\s*Kekuatan\s*([\d.]+)%\s*\|\s*Risiko\s*([\d.]+)%/);
    if (!m) continue;
    let text = m[2].trim();
    const mek = lines[i + 1]?.match(/^\s+Mekanisme:\s*(.+)/);
    if (mek) text += ` — Mekanisme: ${mek[1].trim()}`;
    out.push({
      tier: m[1] === "N" ? "S" : m[1],
      text,
      strength: parseFloat(m[3]),
      risk: parseFloat(m[4]),
    });
  }
  return out;
}

const section = (body, name) => {
  const re = new RegExp(`---\\s*${name}\\s*---\\n([\\s\\S]*?)(?=\\n---\\s|\\n={5,}|$)`, "i");
  const m = body.match(re);
  return m ? m[1].trim() : "";
};
const sideOf = (txt, side) => {
  const m = txt.match(new RegExp(`^${side}:\\s*([\\s\\S]*?)(?=\\n(?:PRO|KON):|$)`, "m"));
  return m ? m[1].trim().replace(/\s*\n\s*/g, " ") : undefined;
};

let added = 0;
for (const f of files) {
  const text = fs.readFileSync(f, "utf8");
  // pisah per blok judul "mNNN — judul" yang diapit garis '=' atau di awal baris
  const parts = text.split(/\n=+\n/);
  for (let i = 0; i < parts.length; i++) {
    const head = parts[i].trim();
    const hm = head.match(/^m[f]?\d+\s+—\s+([\s\S]+)$/);
    if (!hm) continue;
    const body = parts[i + 1] || "";
    if (!/---\s*PRO/i.test(body)) continue;
    const title = hm[1].replace(/\s*\n\s*/g, " ").trim();
    if (seen.has(norm(title))) continue;
    seen.add(norm(title));

    const g = (re) => (body.match(re) || [, ""])[1].trim();
    const tipe = g(/^Tipe:\s*([^\n|]+)/m);
    const hybrid = g(/\|\s*Hibrid:\s*([^\n]+)/m);
    const ctx = g(/^Konteks:\s*([^\n]+)/m) || g(/^Info-?slide[^:]*:\s*([^\n]+)/mi);
    const note = g(/^Catatan pakai:\s*([^\n]+)/m);
    const prob = body.match(/^Probabilitas:\s*PRO\s*([\d.]+)%\s*·\s*KON\s*([\d.]+)%\s*(?:—\s*(.+))?/m);
    const terms = g(/^Istilah kunci:\s*([^\n]+)/m).split(/,\s*/).filter(Boolean);

    const proBlock = section(body, "PRO \\(10 poin\\)") || section(body, "PRO");
    const konBlock = section(body, "KON \\(10 poin\\)") || section(body, "KON");
    const tiersPro = parsePoints(proBlock);
    const tiersKon = parsePoints(konBlock);
    if (tiersPro.length < 3 || tiersKon.length < 3) continue;

    const ideal = section(body, "IDEAL CASE");
    const mayor = section(body, "MAYOR CASE");
    const minor = section(body, "MINOR CASE");
    const niche = section(body, "NICHE CASE");
    const rot = section(body, "ROTASI");
    const riset = section(body, "RISET");
    const weighing = section(body, "WEIGHING UTAMA");

    maxNum += 1;
    const id = `m${String(maxNum).padStart(3, "0")}`;
    list.push({
      id,
      title,
      cat: catOf(tipe, hybrid),
      type: tipe || "kebijakan",
      hybrid: hybrid || undefined,
      ctx: ctx || undefined,
      note: note || undefined,
      probPro: prob ? parseFloat(prob[1]) : undefined,
      probKon: prob ? parseFloat(prob[2]) : undefined,
      probNote: prob && prob[3] ? prob[3].trim() : undefined,
      terms,
      pro: tiersPro.map((p) => p.text),
      kon: tiersKon.map((p) => p.text),
      tiersPro,
      tiersKon,
      cases: {
        ideal: { pro: sideOf(ideal, "PRO"), kon: sideOf(ideal, "KON") },
        mayor: { pro: sideOf(mayor, "PRO"), kon: sideOf(mayor, "KON") },
        minor: { pro: sideOf(minor, "PRO"), kon: sideOf(minor, "KON") },
        niche: { pro: sideOf(niche, "PRO"), kon: sideOf(niche, "KON") },
      },
      rotation: {
        ofensif: (rot.match(/^Ofensif[^:]*:\s*([\s\S]*?)(?=\nDefensif|$)/m) || [, ""])[1].trim().replace(/\s*\n\s*/g, " ") || undefined,
        defensif: (rot.match(/^Defensif[^:]*:\s*([\s\S]*)$/m) || [, ""])[1].trim().replace(/\s*\n\s*/g, " ") || undefined,
      },
      ideal: weighing || undefined,
      research: riset ? riset.replace(/\s*\n\s*/g, "\n") : undefined,
    });
    added++;
  }
}

fs.writeFileSync(OUT, JSON.stringify(raw, null, 2));
console.log(`added ${added}, total ${list.length}`);
