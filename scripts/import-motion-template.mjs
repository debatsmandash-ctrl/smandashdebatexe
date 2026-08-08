// Importer untuk template analisis mosi lengkap (BATCH mosi_batch_01).
// Menambahkan mosi baru ke src/data/raw/motions.json dengan id lanjutan.
import fs from "node:fs";

const FILES = process.argv.slice(2);
const OUT = "src/data/raw/motions.json";
const existing = JSON.parse(fs.readFileSync(OUT, "utf8"));
const maxId = existing.reduce((m, x) => Math.max(m, parseInt(String(x.id).slice(1), 10) || 0), 0);

const CAT_MAP = {
  politik: "politik", ekonomi: "ekonomi", hukum: "hukum", sosial: "sosial",
  filsafat: "filosofi", kesehatan: "kesehatan", lingkungan: "lingkungan",
  pendidikan: "pendidikan", teknologi: "sains", hi: "hi", agama: "agama",
};

function parseFile(text) {
  const lines = text.split(/\r?\n/);
  const out = [];
  let cur = null;
  let mode = null;

  const push = () => { if (cur) out.push(cur); cur = null; mode = null; };

  const point = (line) => {
    const m = line.match(/^\[([SABC])\]\s*(.+?)\s*\|\s*Kekuatan\s*([\d.]+)%\s*\|\s*Risiko\s*([\d.]+)%\s*$/i);
    if (!m) return null;
    return { tier: m[1].toUpperCase(), text: m[2].trim(), strength: parseFloat(m[3]), risk: parseFloat(m[4]) };
  };

  for (const raw of lines) {
    const line = raw.trim();
    const head = line.match(/^(m\d{3})\s+—\s+(.+)$/);
    if (head) {
      push();
      cur = {
        _srcId: head[1], title: head[2].trim(),
        cat: "politik", type: "analisis", pro: [], kon: [],
        tiersPro: [], tiersKon: [], terms: [], cases: {}, rotation: {},
      };
      continue;
    }
    if (!cur) continue;
    let m;
    if ((m = line.match(/^Tipe:\s*([^|]+)(?:\|\s*Hibrid:\s*(.+))?$/i))) {
      cur.type = m[1].trim();
      if (m[2]) {
        const hyb = m[2].trim();
        cur.hybrid = hyb;
        const key = hyb.split("-")[0].toLowerCase();
        if (CAT_MAP[key]) cur.cat = CAT_MAP[key];
      }
      continue;
    }
    if ((m = line.match(/^Konteks:\s*(.+)$/i))) { cur.ctx = m[1]; continue; }
    if ((m = line.match(/^Catatan pakai:\s*(.+)$/i))) { cur.note = m[1]; continue; }
    if ((m = line.match(/^Probabilitas:\s*PRO\s*([\d.]+)%\s*·\s*KON\s*([\d.]+)%(?:\s*—\s*(.+))?$/i))) {
      cur.probPro = parseFloat(m[1]); cur.probKon = parseFloat(m[2]);
      if (m[3]) cur.probNote = m[3].trim();
      continue;
    }
    if ((m = line.match(/^Istilah kunci:\s*(.+)$/i))) {
      cur.terms = m[1].split(",").map((s) => s.trim()).filter(Boolean);
      continue;
    }
    if (/^---\s*PRO/i.test(line)) { mode = "pro"; continue; }
    if (/^---\s*KON/i.test(line)) { mode = "kon"; continue; }
    if (/^---\s*IDEAL CASE/i.test(line)) { mode = "ideal"; continue; }
    if (/^---\s*MAYOR CASE/i.test(line)) { mode = "mayor"; continue; }
    if (/^---\s*MINOR CASE/i.test(line)) { mode = "minor"; continue; }
    if (/^---\s*NICHE CASE/i.test(line)) { mode = "niche"; continue; }
    if (/^---\s*ROTASI/i.test(line)) { mode = "rotasi"; continue; }
    if (/^---\s*RISET/i.test(line)) { mode = "riset"; continue; }
    if (/^={3,}/.test(line) || !line) continue;

    if (mode === "pro" || mode === "kon") {
      const p = point(line);
      if (p) {
        cur[mode === "pro" ? "tiersPro" : "tiersKon"].push(p);
        cur[mode].push(p.text);
      }
      continue;
    }
    if (["ideal", "mayor", "minor", "niche"].includes(mode)) {
      const side = line.match(/^(PRO|KON):\s*(.+)$/i);
      cur.cases[mode] = cur.cases[mode] || {};
      if (side) cur.cases[mode][side[1].toLowerCase()] = side[2].trim();
      continue;
    }
    if (mode === "rotasi") {
      const side = line.match(/^(Ofensif|Defensif)\s*(\([^)]*\))?:\s*(.+)$/i);
      if (side) cur.rotation[side[1].toLowerCase()] = `${side[2] ? side[2] + " " : ""}${side[3]}`.trim();
      continue;
    }
    if (mode === "riset") {
      cur.research = cur.research ? cur.research + " " + line : line;
      continue;
    }
  }
  push();
  return out;
}

let all = [];
for (const f of FILES) all = all.concat(parseFile(fs.readFileSync(f, "utf8")));

let n = maxId;
const added = [];
for (const m of all) {
  n += 1;
  const id = "m" + String(n).padStart(3, "0");
  delete m._srcId;
  // ideal ringkas HTML (dipakai panel lama)
  const c = m.cases.ideal || {};
  if (c.pro || c.kon) {
    m.ideal = [
      c.pro ? `<strong>PRO (Ideal):</strong> ${c.pro}` : null,
      c.kon ? `<strong>KON (Ideal):</strong> ${c.kon}` : null,
    ].filter(Boolean).join("<br><br>\n");
  }
  added.push({ id, ...m });
}

const merged = [...existing, ...added];
fs.writeFileSync(OUT, JSON.stringify(merged, null, 2) + "\n");
console.log(`Added ${added.length} motions (${added[0]?.id}..${added.at(-1)?.id}); total ${merged.length}`);
