# v1.1 — Blobby Universe, Bento Panels, Corporate Lobby & Ultra Graphics

Lanjutan dari v1.0. Fokus: 6 tugas berturutan sesuai instruksi terakhir.

---

## 1 · Blobby Cluster Sphere (reshape penuh `build.ts`)

Ganti algoritma layout dari fibonacci-sphere simetris ke **noise-deformed ellipsoid dengan gugusan padat per-domain**.

- File baru `src/lib/graph/layout-blobby.ts`:
  - **Domain centroids** disebar di permukaan ellipsoid (a≠b≠c) via fibonacci-sphere, lalu radius tiap centroid di-deform pakai 3D simplex-noise (amplitudo ±25%). Hasil: bola bergelombang, tidak simetris.
  - **Poisson-disc dalam cluster**: node domain didistribusi 3D Poisson-disc (min-distance seeded per-cluster) dalam bola cluster berjari-jari proporsional √(count). Domain kecil (Kamus) dapat radius lebih besar → boleh menjorok ke ruang kosong antar-gugus, tapi collision-check vs centroid tetangga tetap dijaga.
  - **Nested placement**: Bab/Subbab/Motion/Vocab diposisikan sebagai halo di sekitar centroid domain-nya (bukan grid). Root & cluster-hub tetap di dalam volume, tidak di orbit.
  - **No-collision pass** akhir: relax step 3× (Lloyd-like) untuk pastikan spacing minimum.
- `build.ts` panggil layout baru; hapus fibonacci-symmetric path.
- Deps: `simplex-noise` (add jika belum ada).

---

## 2 · Panel Infografis Bento Penuh

Rombak `src/components/shell/panels/PanelContent.tsx` + tambah subcomponent `src/components/panels/infographic/`:

- **BentoGrid**: layout CSS-grid dengan mixed row/col span, corner-bracket HUD, border neon warna domain, gradasi soft di background.
- **Text `text-align: justify`** + `hyphens: auto` untuk paragraf panjang.
- **Sections per node kind**:
  - **Header stats**: mini KPI cards (jumlah edge, cluster size, weight, importance, category).
  - **Extended matter**: expand SEMUA field dari `data/raw/*.json` yang saat ini tidak ditampilkan — `terms`, `research`, `ideal`, `ctx`, `pro`/`kon` lengkap, `contoh`, `comp`. Collapsible per section.
  - **Related stars grid**: card-grid node terkait (klik = navigate).
  - **Mini chart** kontekstual:
    - Motion → **RadarPro/Kon** (strength count), badge meta **OFENSIF / DEFENSIF** dihitung dari rasio pro:kon + kata kunci (mis. "ban", "abolish" → ofensif; "protect", "preserve" → defensif).
    - Role → radar skills.
    - Domain → sunburst subtree + stacked bar per subbab.
    - Vocab → chip cloud sinonim + usage frequency bar.
  - **Fakta menarik / tips** box (statis dari data + template).
- Animasi: stagger fade-in, hover-lift halus.

**Meta ofensif/defensif** (`src/lib/motion/stance.ts`): heuristik keyword + rasio; hasil disimpan di derived cache, ditampilkan sebagai badge di panel & di tooltip node.

---

## 3 · Ingest BATCH-04/05/06 ke `motions.json`

- Baca 3 file batch txt dari upload (yang sebelumnya di-hold).
- Extend `scripts/import-motions-batch1.mjs` → `import-motions-batches.mjs` yang menerima arg `--batch=04|05|06|all`.
- Parse ke schema `Motion` existing (`id`, `title`, `cat`, `type`, `ctx`, `pro`, `kon`, `terms`, `ideal`, `research`, `comp`).
- Auto-assign `cat` dari heading batch, `type` dari struktur (policy/value/fact), `comp` dari kata kunci ofensif/defensif.
- Merge ke `src/data/raw/motions.json` (dedupe by title-normalized).
- Regenerate graph nodes.

Kalau file batch belum tersedia di project (perlu re-upload), akan minta user upload ulang sebelum implement — plan tetap.

---

## 4 · Extend & Perpanjang Materi Existing

Audit tiap raw JSON, isi field yang kosong / tipis:

- **`matter.json`** (per subbab): tambah `keyPoints[]` (5-8 bullet), `commonMistakes[]`, `winningAngles[]`, `sampleAnalogy`, `dataPoint` (statistik/fakta) — generatif dari konten existing + template debate coaching.
- **`motions.json`**: pastikan tiap motion punya minimum 4 pro + 4 kon, `terms` ≥3, `ideal` (ideal case scenario 2-3 kalimat), `research` (2-3 link/topic), `comp` (ofensif/defensif + reason).
- **`roles.json`**: extend tiap role dengan `duties[]` (8-12), `commonPitfalls`, `advancedTactics`, `timeBudget`, `signaturePhrases`.
- **`jenis-mosi.json`**: perbanyak `contoh` (≥5) + `strategyTips`.
- **`vocab.json`**: tambah `usageExample`, `relatedTerms[]`, `misconception`.

Semua extension ditulis sebagai **augmentation layer** di `src/data/enrich/*.ts` (tidak overwrite raw JSON, di-merge saat build graph) supaya reversible.

---

## 5 · Lobby: Corporate Modern Minimalis Dark Theme

Rombak `MissionControl.tsx`:

- Buang aesthetic NASA-tech neon → **korporat profesional**: dark navy/graphite (#0A0E1A base), aksen putih + accent tunggal (electric blue #3B82F6 atau amber #F59E0B), typography sans-serif clean (Inter/Söhne-alike), spacing generous.
- Layout: hero brand block kiri, mission brief singkat, 3-4 KPI card monokrom, 1 CTA utama "Enter Universe", secondary "Settings / About".
- Chart minimalis (line/bar tipis, no glow), microcopy singkat.
- No countdown, no HUD brackets, no rotating telemetry. Elegan, tenang.
- **Cinematic intro 3-4 detik** SEBELUM lobby: `src/components/lobby/Intro.tsx` — brand mark reveal, subtle particle/logo animation, skip-able (klik/tap/esc), fade ke lobby. Persist `introSeen` di store terpisah dari `lobbySeen`.

Flow final: **Intro (3-4s) → Corporate Lobby → Enter → Universe**.

---

## 6 · Style Lama Jadi Page "Information"

- Aesthetic NASA Mission Control (bento HUD, neon, telemetry, sunburst, heatmap, cards) di-**pindah** ke halaman baru `src/routes/information.tsx` (`/information`).
- Isi page: dashboard lengkap dataset — total nodes/edges/domains, distribution charts, heatmap tautan antar-domain, mission cards per cluster, mini-explorer, playlist widget, "did you know" facts box.
- Warna: **boleh gradasi + warna terang** (violet→cyan→amber gradient panels, glow accents) — kebalikan dari lobby yang tenang.
- Link dari lobby ("View Information") dan dari sidebar Universe ("◄ Information").

---

## 7 · Ultra Graphics Preset (RTX 5090 tier)

Update `useDeviceProfile` + `SettingsPanel` performance tab:

- Quality preset `ultra` (existing) di-boost:
  - DPR clamp naik ke [2, 3.5]
  - Star segments 48, halo layers 3, crust shells 3 octaves 7
  - Bloom intensity 2.4, radius 1.2, luminance smoothing 0.9
  - Chromatic aberration + vignette + film grain halus
  - Nebula steps 128, volumetric god-rays (`@react-three/postprocessing` GodRays) pada core cluster
  - SSAO on, TAA on (via `postprocessing` EffectComposer)
  - Auto-rotate speed reduced, damping halus
  - Star twinkle shader (per-vertex noise), edge shader flow lebih kompleks
- Preset baru `cinematic` (ultra + depth-of-field + motion blur) opsional.
- Auto-detect: `navigator.gpu` + `deviceMemory ≥ 8` + non-mobile → suggest ultra; ada tombol "Boost to Ultra" di lobby untuk high-end.
- Warning kalau <60fps: banner suggest turun preset.

---

## Technical Section

**Files baru**
- `src/lib/graph/layout-blobby.ts`
- `src/lib/motion/stance.ts`
- `src/lib/data/enrich/{matter,motions,roles,jenis,vocab}.ts`
- `src/components/lobby/Intro.tsx`
- `src/components/lobby/CorporateLobby.tsx` (ganti isi MissionControl)
- `src/components/panels/infographic/{BentoGrid,MiniRadar,RelatedGrid,StatKpi,StanceBadge,FactBox}.tsx`
- `src/routes/information.tsx`
- `scripts/import-motions-batches.mjs`

**Files diedit**
- `src/lib/graph/build.ts` (pakai layout-blobby + merge enrich layer)
- `src/lib/store.ts` (add `introSeen`, `graphicsPreset` extend, information route state)
- `src/components/lobby/MissionControl.tsx` (jadi CorporateLobby)
- `src/components/shell/panels/PanelContent.tsx` (bento redesign)
- `src/components/universe/Universe.tsx` (ultra pipeline: SSAO/TAA/GodRays/DOF)
- `src/hooks/useDeviceProfile.ts` (ultra tier boost)
- `src/components/shell/SettingsPanel.tsx` (preset cinematic, boost toggle)
- `src/data/raw/motions.json` (append batches)
- `src/routes/__root.tsx` (link ke /information)

**Packages ditambah**
- `simplex-noise` (jika belum)
- `@react-three/postprocessing` extras (GodRays, DepthOfField, SSAO, Noise, Vignette) — sudah ada base
- `d3-hierarchy` (untuk sunburst di /information)

**Assets**
- (opsional) 1 background gradient hero untuk /information

---

## Urutan Build
1. Blobby layout + no-collision (§1) — fondasi visual
2. Ingest batches + enrich layers (§3, §4) — data siap
3. Bento panel infographic + stance meta (§2)
4. Corporate lobby + Intro + /information route (§5, §6)
5. Ultra graphics pipeline (§7)
6. QA: mobile low-graphic, desktop ultra, semua route

---

## Scope Guardrails
- Raw JSON motions dimutasi (append batches); matter/roles/vocab tidak — pakai enrich layer.
- Tidak ubah auth/backend.
- Kalau file BATCH-04/05/06 belum ada di sandbox, minta user upload dulu sebelum §3.

Approve untuk mulai step 1.
