// Parser for BATCH-04/05/06 which use richer format:
//  - cat: A · B · C | type: X / Y [MULTI]
//  - ctx-pandangan / ctx-narasi / ctx-kebijakan / ctx-penyesalan / ctx-prediksi / ctx-dukungan / ctx-memilih
//  - MATTER TAG: ...
//  - PRO/KON bullets
//  - TERMS
//  - NARASI (PRO): / NARASI (OPP):
//  - IDEAL (PRO): / IDEAL (OPP): / IDEAL (PRO-KEBIJAKAN): / IDEAL (PRO-PANDANGAN): / etc
//  - RESEARCH
//
// Usage: node scripts/import-motions-batches.mjs [file1 file2 ...]
import fs from "node:fs";

const FILES = process.argv.slice(2);
if (FILES.length === 0) {
  FILES.push(
    "/mnt/user-uploads/BATCH-04-MultiJenis-CrossDomain-Narasi.txt",
    "/mnt/user-uploads/BATCH-05-Indonesia-MultiJenis-NarasiLanjutan.txt",
    "/mnt/user-uploads/BATCH-06-EtikaHewan-RuangDigital-KesehatanReproduksi.txt"
  );
}
const OUT = "src/data/raw/motions.json";

const catMap = {
  ekonomi: "ekonomi", politik: "politik", hukum: "hukum",
  filsafat: "filosofi", filosofi: "filosofi",
  sosial: "sosial", sains: "teknologi", teknologi: "teknologi",
  hi: "hubungan-internasional", "hubungan-internasional": "hubungan-internasional",
  psikologi: "sosial", pendidikan: "pendidikan",
  feminisme: "sosial", antropologi: "sosial",
  kesehatan: "sosial", lingkungan: "lingkungan", agama: "agama",
};
const typeMap = {
  KEBIJAKAN: "kebijakan", PANDANGAN: "pandangan", AKTOR: "aktor",
  PENYESALAN: "penyesalan", PREDIKSI: "prediksi", DUKUNGAN: "dukungan",
  MEMILIH: "memilih", NARASI: "pandangan", HARAPAN: "pandangan",
};

function titleCase(s) {
  return s.toLowerCase().split(" ").map((w) =>
    w.length <= 2 && /^(di|ke|dan|atau|of|the|on|in|to|a|an|&|vs)$/i.test(w)
      ? w : w[0]?.toUpperCase() + w.slice(1)
  ).join(" ");
}

function parseFile(txt) {
  const lines = txt.split(/\r?\n/);
  const motions = [];
  let cur = null;
  let mode = null;
  let acc = null; // { key: 'ideal'|'research'|'narasi' }

  const commit = () => {
    if (!cur) return;
    // Compose ideal from ctx + ideal blocks
    const idealParts = [];
    for (const [k, v] of Object.entries(cur._ideal || {})) {
      idealParts.push(`<strong>${k}:</strong> ${v.trim()}`);
    }
    if (idealParts.length) cur.ideal = idealParts.join("<br><br>\n");
    if (cur._narasi) {
      const parts = [];
      for (const [k, v] of Object.entries(cur._narasi)) parts.push(`<strong>NARASI ${k}:</strong> ${v.trim()}`);
      cur.ideal = (cur.ideal ? cur.ideal + "<br><br>\n" : "") + parts.join("<br><br>\n");
    }
    // Compose ctx from ctx-* variants
    if (!cur.ctx && cur._ctx) {
      cur.ctx = Object.entries(cur._ctx).map(([k, v]) => `[${k.toUpperCase()}] ${v}`).join(" · ");
    }
    delete cur._ideal; delete cur._narasi; delete cur._ctx;
    if (!cur.pro?.length) delete cur.pro;
    if (!cur.kon?.length) delete cur.kon;
    if (!cur.terms?.length) delete cur.terms;
    // Offensive/Defensive heuristic
    const blob = ((cur.title||"") + " " + (cur.ctx||"")).toLowerCase();
    const offKw = /(ban|abolish|remove|hapus|larang|reject|tolak|dismantle|bubarkan|end |akhiri|hancurkan|hentikan)/;
    const defKw = /(protect|defend|preserve|jaga|pertahankan|lindungi|dukung|support|maintain|perkuat)/;
    cur.comp = offKw.test(blob) ? "ofensif" : defKw.test(blob) ? "defensif" : (cur.pro?.length||0) > (cur.kon?.length||0) ? "ofensif" : "defensif";
    motions.push(cur);
    cur = null; mode = null; acc = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    // header
    const mHead = line.match(/^\[(m\d+)\]\s+(.+?)(?:\s+\[[A-Z-]+\])*\s*$/);
    if (mHead) {
      commit();
      cur = { id: mHead[1], title: titleCase(mHead[2]), pro: [], kon: [], terms: [], _ctx: {}, _ideal: {}, _narasi: {} };
      mode = null; acc = null;
      continue;
    }
    if (!cur) continue;

    let m;
    if ((m = line.match(/^orig:\s*(.+)$/i))) { cur.orig = m[1]; mode = null; continue; }
    if ((m = line.match(/^cat:\s*([^|]+?)\s*\|\s*type:\s*(.+?)(?:\s*\[[A-Z-]+\])?\s*$/i))) {
      const cats = m[1].split(/·|\/|,|\|/).map(s => s.trim().toLowerCase()).filter(Boolean);
      const primary = cats[0];
      cur.cat = catMap[primary] || primary;
      cur.catAll = cats.map(c => catMap[c] || c);
      const types = m[2].split(/\/|·/).map(t => t.trim().toUpperCase()).filter(Boolean);
      cur.type = typeMap[types[0]] || types[0]?.toLowerCase() || "pandangan";
      cur.typeAll = types.map(t => typeMap[t] || t.toLowerCase());
      mode = null; continue;
    }
    if ((m = line.match(/^ctx-([a-z]+):\s*(.+)$/i))) {
      cur._ctx[m[1].toLowerCase()] = m[2];
      mode = "ctx"; acc = { key: m[1].toLowerCase() };
      continue;
    }
    if ((m = line.match(/^ctx:\s*(.+)$/i))) { cur.ctx = m[1]; mode = null; continue; }
    if ((m = line.match(/^MATTER TAG:\s*(.+)$/i))) { cur.matterTag = m[1]; mode = null; continue; }
    if (/^PRO:\s*$/i.test(line)) { mode = "pro"; continue; }
    if (/^KON:\s*$/i.test(line)) { mode = "kon"; continue; }
    if ((m = line.match(/^TERMS:\s*(.+)$/i))) {
      cur.terms = m[1].split(",").map(s => s.trim()).filter(Boolean);
      mode = null; continue;
    }
    if ((m = line.match(/^NARASI\s*\(([A-Z-]+)\):\s*(.+)$/i))) {
      cur._narasi[m[1]] = m[2]; mode = "narasi"; acc = { key: m[1] }; continue;
    }
    if ((m = line.match(/^IDEAL\s*\(([A-Z-]+)\):\s*(.+)$/i))) {
      cur._ideal[m[1]] = m[2]; mode = "ideal"; acc = { key: m[1] }; continue;
    }
    if ((m = line.match(/^RESEARCH:\s*(.+)$/i))) {
      cur.research = m[1]; mode = "research"; continue;
    }
    if (mode === "pro" || mode === "kon") {
      const b = line.match(/^-\s+(.+)$/);
      if (b) cur[mode].push(b[1]);
      else if (line.trim() === "") { /* keep */ }
      else mode = null;
      continue;
    }
    if (mode === "ctx" && acc && line.trim()) { cur._ctx[acc.key] += " " + line.trim(); continue; }
    if (mode === "ideal" && acc && line.trim()) { cur._ideal[acc.key] += " " + line.trim(); continue; }
    if (mode === "narasi" && acc && line.trim()) { cur._narasi[acc.key] += " " + line.trim(); continue; }
    if (mode === "research" && line.trim()) { cur.research += " " + line.trim(); continue; }
  }
  commit();
  return motions;
}

const allNew = [];
for (const f of FILES) {
  if (!fs.existsSync(f)) { console.warn("SKIP (not found):", f); continue; }
  const txt = fs.readFileSync(f, "utf8");
  const arr = parseFile(txt);
  console.log(`Parsed ${arr.length} motions from ${f}`);
  allNew.push(...arr);
}

const existing = JSON.parse(fs.readFileSync(OUT, "utf8"));
const existingIds = new Set(existing.map(x => x.id));
const existingTitles = new Set(existing.map(x => (x.title||"").toLowerCase().trim()));
let added = 0, dup = 0;
const merged = [...existing];
for (const m of allNew) {
  if (existingIds.has(m.id) || existingTitles.has(m.title.toLowerCase().trim())) { dup++; continue; }
  merged.push(m); added++;
}
merged.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
fs.writeFileSync(OUT, JSON.stringify(merged, null, 2) + "\n");
console.log(`Added ${added} new motions (${dup} dupes). Total: ${merged.length}.`);
